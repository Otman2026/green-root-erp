import { createServerFn } from "@tanstack/react-start";
import { generateText, Output, NoObjectGeneratedError } from "ai";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { createLovableAiGatewayProvider } from "./ai-gateway.server";

const Input = z.object({
  plant: z.string().optional(),
  description: z.string().min(3),
  imageDataUrl: z.string().optional(),
  lang: z.enum(["ar", "fr", "en"]).default("ar"),
});

type MatchedIds = {
  disease_ids: string[];
  pest_ids: string[];
  weed_ids: string[];
  pesticide_ids: string[];
  fertilizer_ids: string[];
};

const emptyMatchedIds: MatchedIds = {
  disease_ids: [],
  pest_ids: [],
  weed_ids: [],
  pesticide_ids: [],
  fertilizer_ids: [],
};

function toStringArray(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value
      .flatMap((item) => toStringArray(item))
      .map((item) => item.trim())
      .filter(Boolean);
  }

  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return [];
    return trimmed
      .split(/\n|(?:^|\s)[•*-]\s+/)
      .map((item) => item.replace(/^[-•*]\s*/, "").trim())
      .filter(Boolean);
  }

  if (value && typeof value === "object") {
    return Object.values(value).flatMap((item) => toStringArray(item));
  }

  return [];
}

function normalizeConfidence(value: unknown): "low" | "medium" | "high" {
  return value === "high" || value === "medium" || value === "low" ? value : "low";
}

function classifyIds(ids: string[], kb: any): MatchedIds {
  const matched: MatchedIds = {
    disease_ids: [],
    pest_ids: [],
    weed_ids: [],
    pesticide_ids: [],
    fertilizer_ids: [],
  };
  const known = {
    disease_ids: new Set((kb?.diseases ?? []).map((item: any) => item.id)),
    pest_ids: new Set((kb?.pests ?? []).map((item: any) => item.id)),
    weed_ids: new Set((kb?.weeds ?? []).map((item: any) => item.id)),
    pesticide_ids: new Set((kb?.pesticides ?? []).map((item: any) => item.id)),
    fertilizer_ids: new Set((kb?.fertilizers ?? []).map((item: any) => item.id)),
  };

  for (const id of ids.filter(Boolean)) {
    let placed = false;
    for (const key of Object.keys(known) as Array<keyof typeof known>) {
      if (known[key].has(id)) {
        matched[key].push(id);
        placed = true;
      }
    }
    if (!placed) matched.disease_ids.push(id);
  }

  return matched;
}

function normalizeMatchedIds(value: unknown, kb: any) {
  if (Array.isArray(value) || typeof value === "string") {
    return classifyIds(toStringArray(value), kb);
  }

  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;
    const direct = {
      disease_ids: toStringArray(record.disease_ids ?? record.diseases),
      pest_ids: toStringArray(record.pest_ids ?? record.pests),
      weed_ids: toStringArray(record.weed_ids ?? record.weeds),
      pesticide_ids: toStringArray(record.pesticide_ids ?? record.pesticides),
      fertilizer_ids: toStringArray(record.fertilizer_ids ?? record.fertilizers),
    };
    const loose = toStringArray(record.ids ?? record.matched ?? record.items);
    if (loose.length > 0) {
      const classified = classifyIds(loose, kb);
      return {
        disease_ids: [...direct.disease_ids, ...classified.disease_ids],
        pest_ids: [...direct.pest_ids, ...classified.pest_ids],
        weed_ids: [...direct.weed_ids, ...classified.weed_ids],
        pesticide_ids: [...direct.pesticide_ids, ...classified.pesticide_ids],
        fertilizer_ids: [...direct.fertilizer_ids, ...classified.fertilizer_ids],
      };
    }
    return direct;
  }

  return {
    disease_ids: [],
    pest_ids: [],
    weed_ids: [],
    pesticide_ids: [],
    fertilizer_ids: [],
  };
}

function parseJsonCandidate(text: string): unknown {
  const withoutFences = text
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/```$/i, "")
    .trim();

  try {
    return JSON.parse(withoutFences);
  } catch {
    // Continue with extraction from mixed model text.
  }

  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenced?.[1]) return JSON.parse(fenced[1].trim());

  const start = withoutFences.search(/[\[{]/);
  if (start === -1) throw new Error("No JSON found");

  const opener = withoutFences[start];
  const closer = opener === "[" ? "]" : "}";
  let depth = 0;
  let inString = false;
  let escaped = false;

  for (let index = start; index < withoutFences.length; index += 1) {
    const char = withoutFences[index];
    if (escaped) {
      escaped = false;
      continue;
    }
    if (char === "\\") {
      escaped = true;
      continue;
    }
    if (char === '"') {
      inString = !inString;
      continue;
    }
    if (inString) continue;
    if (char === opener) depth += 1;
    if (char === closer) depth -= 1;
    if (depth === 0) return JSON.parse(withoutFences.slice(start, index + 1));
  }

  const repaired = withoutFences
    .slice(start)
    .replace(/,\s*([}\]])/g, "$1")
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "");
  return JSON.parse(repaired);
}

function tokenize(text: string): string[] {
  return text.toLowerCase().replace(/[^\p{L}\p{N}\s]/gu, " ").split(/\s+/).filter((w) => w.length >= 3).slice(0, 12);
}

async function retrieveKnowledge(supabase: any, plant: string | undefined, description: string) {
  const tokens = tokenize(`${plant ?? ""} ${description}`);
  if (tokens.length === 0) return { diseases: [], pests: [], weeds: [], pesticides: [], fertilizers: [], treatments: [], products: [] };

  const orClause = (cols: string[]) => tokens.flatMap((t) => cols.map((c) => `${c}.ilike.%${t}%`)).join(",");

  const [diseasesR, pestsR, weedsR, pesticidesR, fertilizersR, treatmentsR] = await Promise.all([
    supabase.from("agri_diseases")
      .select("id,name_ar,name_fr,name_en,scientific_name,type,description,symptoms,severity,prevention")
      .or(orClause(["name_ar", "name_fr", "name_en", "symptoms", "scientific_name", "description"])).limit(5),
    supabase.from("agri_pests")
      .select("id,name_ar,name_fr,name_en,scientific_name,type,description,life_cycle,damage,severity")
      .or(orClause(["name_ar", "name_fr", "name_en", "damage", "scientific_name", "description"])).limit(5),
    supabase.from("agri_weeds")
      .select("id,name_ar,name_fr,name_en,scientific_name,description,control_chemical,control_cultural,control_mechanical")
      .or(orClause(["name_ar", "name_fr", "name_en", "description", "scientific_name"])).limit(3),
    supabase.from("agri_pesticides")
      .select("id,name_ar,name_fr,trade_name,active_ingredient,category,target_pests,target_diseases,dosage,application_method,pre_harvest_interval_days,alternatives,product_id")
      .or(orClause(["name_ar", "name_fr", "trade_name", "active_ingredient", "target_pests", "target_diseases"])).limit(6),
    supabase.from("agri_fertilizers")
      .select("id,name_ar,name_fr,brand,type,n_percent,p_percent,k_percent,dosage,application_method,suitable_crops,product_id")
      .or(orClause(["name_ar", "name_fr", "brand", "type", "suitable_crops"])).limit(4),
    supabase.from("agri_treatments")
      .select("id,title,description,target_type,target_id,method,active_ingredient,dosage,frequency,safety_period")
      .or(orClause(["title", "description", "active_ingredient", "method"])).limit(5),
  ]);

  const productIds = [
    ...(pesticidesR.data ?? []).map((p: any) => p.product_id),
    ...(fertilizersR.data ?? []).map((p: any) => p.product_id),
  ].filter(Boolean);

  let products: any[] = [];
  if (productIds.length > 0) {
    const { data } = await supabase.from("products").select("id,name_ar,name_fr,sku,stock_quantity,sale_price").in("id", productIds);
    products = data ?? [];
  }

  return {
    diseases: diseasesR.data ?? [],
    pests: pestsR.data ?? [],
    weeds: weedsR.data ?? [],
    pesticides: pesticidesR.data ?? [],
    fertilizers: fertilizersR.data ?? [],
    treatments: treatmentsR.data ?? [],
    products,
  };
}

const stringArraySchema = z.preprocess(toStringArray, z.array(z.string()).default([]));

const MatchedIdsSchema = z.preprocess((value) => normalizeMatchedIds(value, null), z.object({
  disease_ids: stringArraySchema,
  pest_ids: stringArraySchema,
  weed_ids: stringArraySchema,
  pesticide_ids: stringArraySchema,
  fertilizer_ids: stringArraySchema,
}).default(emptyMatchedIds));

const DiagnosisSchema = z.object({
  diagnosis: z.string(),
  confidence: z.preprocess(normalizeConfidence, z.enum(["low", "medium", "high"]).default("low")),
  matched_ids: MatchedIdsSchema,
  symptoms: stringArraySchema,
  causes: stringArraySchema,
  treatments_chemical: stringArraySchema,
  treatments_organic: stringArraySchema,
  treatments_cultural: stringArraySchema,
  prevention: stringArraySchema,
  alternatives: stringArraySchema,
});

function fallbackDiagnosis(description: string, kb: any, rawText?: string): z.infer<typeof DiagnosisSchema> {
  const firstDisease = kb?.diseases?.[0];
  const firstPest = kb?.pests?.[0];
  const diagnosis = rawText?.trim() || [
    firstDisease ? `الاحتمال الأقرب من قاعدة المعرفة: ${firstDisease.name_ar}${firstDisease.scientific_name ? ` (${firstDisease.scientific_name})` : ""}.` : null,
    firstPest ? `يوجد أيضاً احتمال آفة مرتبطة: ${firstPest.name_ar}.` : null,
    "يرجى فحص الجذور والساق والأوراق السفلية وتأكيد الأعراض قبل المعالجة النهائية.",
  ].filter(Boolean).join("\n");

  return DiagnosisSchema.parse({
    diagnosis,
    confidence: rawText ? "medium" : "low",
    matched_ids: {
      disease_ids: firstDisease?.id ? [firstDisease.id] : [],
      pest_ids: firstPest?.id ? [firstPest.id] : [],
      weed_ids: [],
      pesticide_ids: (kb?.pesticides ?? []).slice(0, 2).map((item: any) => item.id),
      fertilizer_ids: (kb?.fertilizers ?? []).slice(0, 2).map((item: any) => item.id),
    },
    symptoms: description,
    causes: [firstDisease?.description, firstPest?.damage].filter(Boolean),
    treatments_chemical: (kb?.pesticides ?? []).map((item: any) => `${item.name_ar}${item.active_ingredient ? ` (${item.active_ingredient})` : ""}: ${item.dosage ?? "اتبع الجرعة المسجلة على الملصق"}`),
    treatments_organic: ["إزالة الأجزاء شديدة الإصابة والتخلص منها خارج الحقل.", "استخدام مكافحات حيوية مناسبة عند توفرها وتحسين تهوية النبات."],
    treatments_cultural: ["تحسين الصرف وتقليل الإجهاد المائي.", "تطبيق دورة زراعية وتنظيف بقايا المحصول المصاب."],
    prevention: [firstDisease?.prevention].filter(Boolean),
    alternatives: (kb?.fertilizers ?? []).map((item: any) => `${item.name_ar}: ${item.dosage ?? "حسب توصية المهندس الزراعي"}`),
  });
}

function normalizeDiagnosisPayload(raw: unknown, kb: any, description: string, rawText?: string): z.infer<typeof DiagnosisSchema> {
  const candidate = Array.isArray(raw) ? raw[0] : raw;
  if (!candidate || typeof candidate !== "object") return fallbackDiagnosis(description, kb, rawText);

  const record = candidate as Record<string, any>;
  const treatmentOptions = record.treatment_options ?? {};
  const recommendations = record.recommendations ?? {};

  return DiagnosisSchema.parse({
    diagnosis: record.diagnosis ?? record.summary ?? rawText ?? "تم تحليل الحالة بالاعتماد على قاعدة المعرفة الزراعية.",
    confidence: record.confidence,
    matched_ids: normalizeMatchedIds(record.matched_ids ?? record.matchedIds ?? record.ids, kb),
    symptoms: record.symptoms ?? record.symptoms_analysis ?? record.symptom_analysis,
    causes: record.causes ?? record.causes_analysis ?? record.likely_causes,
    treatments_chemical: record.treatments_chemical ?? treatmentOptions.chemical ?? recommendations.pesticides,
    treatments_organic: record.treatments_organic ?? treatmentOptions.organic,
    treatments_cultural: record.treatments_cultural ?? treatmentOptions.cultural,
    prevention: record.prevention ?? record.preventive_measures,
    alternatives: record.alternatives ?? recommendations.fertilizers,
  });
}

export const diagnosePlant = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) => Input.parse(raw))
  .handler(async ({ data, context }) => {
    const key = process.env.LOVABLE_API_KEY;
    if (!key) throw new Error("Missing LOVABLE_API_KEY");

    let kb;
    try {
      kb = await retrieveKnowledge(context.supabase, data.plant, data.description);
    } catch (e: any) {
      // Non-fatal: proceed without KB context
      kb = { diseases: [], pests: [], weeds: [], pesticides: [], fertilizers: [], treatments: [], products: [] };
    }

    const gateway = createLovableAiGatewayProvider(key);
    const model = gateway("google/gemini-3-flash-preview");

    const langInstr = data.lang === "fr" ? "Réponds en français." : data.lang === "en" ? "Reply in English." : "أجب باللغة العربية.";

    const kbContext = `
[KNOWLEDGE BASE CONTEXT - use these entries as authoritative reference when relevant. Cite matched IDs in matched_ids.]

DISEASES (${kb.diseases.length}):
${kb.diseases.map((d: any) => `- id=${d.id} | ${d.name_ar} / ${d.name_fr ?? ""} (${d.scientific_name ?? ""}) [${d.type ?? ""}, severity=${d.severity ?? ""}] | symptoms: ${d.symptoms ?? ""} | prevention: ${d.prevention ?? ""}`).join("\n") || "(none)"}

PESTS (${kb.pests.length}):
${kb.pests.map((p: any) => `- id=${p.id} | ${p.name_ar} / ${p.name_fr ?? ""} (${p.scientific_name ?? ""}) | damage: ${p.damage ?? ""} | life-cycle: ${p.life_cycle ?? ""}`).join("\n") || "(none)"}

WEEDS (${kb.weeds.length}):
${kb.weeds.map((w: any) => `- id=${w.id} | ${w.name_ar} / ${w.name_fr ?? ""} | ${w.description ?? ""} | chemical control: ${w.control_chemical ?? ""}`).join("\n") || "(none)"}

PESTICIDES (${kb.pesticides.length}):
${kb.pesticides.map((p: any) => `- id=${p.id} | ${p.name_ar} (${p.trade_name ?? ""}) | AI: ${p.active_ingredient ?? ""} | targets: pests=${p.target_pests ?? ""}, diseases=${p.target_diseases ?? ""} | dosage: ${p.dosage ?? ""} | PHI: ${p.pre_harvest_interval_days ?? "?"}d`).join("\n") || "(none)"}

FERTILIZERS (${kb.fertilizers.length}):
${kb.fertilizers.map((f: any) => `- id=${f.id} | ${f.name_ar} (${f.brand ?? ""}) | NPK=${f.n_percent ?? "?"}-${f.p_percent ?? "?"}-${f.k_percent ?? "?"} | dosage: ${f.dosage ?? ""}`).join("\n") || "(none)"}

TREATMENT PROTOCOLS (${kb.treatments.length}):
${kb.treatments.map((t: any) => `- id=${t.id} | ${t.title} | method=${t.method ?? ""} | AI: ${t.active_ingredient ?? ""} | dosage: ${t.dosage ?? ""} | frequency: ${t.frequency ?? ""} | safety: ${t.safety_period ?? ""}`).join("\n") || "(none)"}
`.trim();

    const system = `You are an expert agricultural diagnostician for Haytam AGRI. ${langInstr}
Base your diagnosis STRICTLY on the KNOWLEDGE BASE CONTEXT when a match exists. Populate matched_ids with the exact ids you used.
If no strong match exists, provide best-effort diagnosis and set confidence to "low".
Always provide chemical + organic + cultural treatment options. Be concise, actionable, evidence-based.

${kbContext}`;

    const userContent: Array<{ type: "text"; text: string } | { type: "image"; image: string }> = [
      { type: "text", text: `Plant: ${data.plant || "unspecified"}\nSymptoms/Description: ${data.description}` },
    ];
    if (data.imageDataUrl) userContent.push({ type: "image", image: data.imageDataUrl });

    let output: z.infer<typeof DiagnosisSchema>;
    try {
      const res = await generateText({
        model,
        output: Output.object({ schema: DiagnosisSchema }),
        system,
        messages: [{ role: "user", content: userContent }],
      });
      output = normalizeDiagnosisPayload(res.output, kb, data.description);
    } catch (e: any) {
      // Fallback: accept common valid-but-different JSON shapes from the model.
      if (NoObjectGeneratedError.isInstance(e) && e.text) {
        try {
          const parsed = parseJsonCandidate(e.text);
          output = normalizeDiagnosisPayload(parsed, kb, data.description, e.text);
        } catch {
          output = fallbackDiagnosis(data.description, kb, e.text);
        }
      } else {
        output = fallbackDiagnosis(data.description, kb);
      }
    }

    const pesticideIds = output.matched_ids?.pesticide_ids ?? [];
    const fertilizerIds = output.matched_ids?.fertilizer_ids ?? [];
    const suggestedProducts = kb.products.filter((p: any) =>
      kb.pesticides.some((t: any) => pesticideIds.includes(t.id) && t.product_id === p.id) ||
      kb.fertilizers.some((t: any) => fertilizerIds.includes(t.id) && t.product_id === p.id),
    );

    return {
      ...output,
      knowledge_base: {
        diseases: kb.diseases,
        pests: kb.pests,
        weeds: kb.weeds,
        pesticides: kb.pesticides,
        fertilizers: kb.fertilizers,
        treatments: kb.treatments,
      },
      suggested_products: suggestedProducts.length > 0 ? suggestedProducts : kb.products,
    };
  });

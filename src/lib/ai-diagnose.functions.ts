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

const DiagnosisSchema = z.object({
  diagnosis: z.string(),
  confidence: z.enum(["low", "medium", "high"]).default("low"),
  matched_ids: z.object({
    disease_ids: z.array(z.string()).nullable().default([]),
    pest_ids: z.array(z.string()).nullable().default([]),
    weed_ids: z.array(z.string()).nullable().default([]),
    pesticide_ids: z.array(z.string()).nullable().default([]),
    fertilizer_ids: z.array(z.string()).nullable().default([]),
  }).default({ disease_ids: [], pest_ids: [], weed_ids: [], pesticide_ids: [], fertilizer_ids: [] }),
  symptoms: z.array(z.string()).default([]),
  causes: z.array(z.string()).default([]),
  treatments_chemical: z.array(z.string()).default([]),
  treatments_organic: z.array(z.string()).default([]),
  treatments_cultural: z.array(z.string()).default([]),
  prevention: z.array(z.string()).default([]),
  alternatives: z.array(z.string()).default([]),
});

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
      output = res.output;
    } catch (e: any) {
      // Fallback: try to parse raw text if schema validation failed
      if (NoObjectGeneratedError.isInstance(e) && e.text) {
        try {
          const cleaned = e.text.replace(/^```json\s*/i, "").replace(/```$/, "").trim();
          const parsed = JSON.parse(cleaned);
          output = DiagnosisSchema.partial().parse(parsed) as any;
        } catch {
          throw new Error("AI diagnosis failed: could not parse response");
        }
      } else {
        throw new Error(e?.message ?? "AI diagnosis failed");
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

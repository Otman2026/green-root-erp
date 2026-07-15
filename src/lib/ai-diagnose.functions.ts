import { createServerFn } from "@tanstack/react-start";
import { generateText, Output } from "ai";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { createLovableAiGatewayProvider } from "./ai-gateway.server";

const Input = z.object({
  plant: z.string().optional(),
  description: z.string().min(3),
  imageDataUrl: z.string().optional(),
  lang: z.enum(["ar", "fr", "en"]).default("ar"),
});

// Simple keyword tokenizer (Arabic/Latin)
function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .split(/\s+/)
    .filter((w) => w.length >= 3)
    .slice(0, 12);
}

async function retrieveKnowledge(
  supabase: any,
  plant: string | undefined,
  description: string,
) {
  const q = `${plant ?? ""} ${description}`;
  const tokens = tokenize(q);
  if (tokens.length === 0) return { diseases: [], pests: [], weeds: [], treatments: [], products: [] };

  // Build ilike OR clauses
  const orClause = (cols: string[]) =>
    tokens
      .flatMap((t) => cols.map((c) => `${c}.ilike.%${t}%`))
      .join(",");

  const [diseasesR, pestsR, weedsR, pesticidesR, fertilizersR] = await Promise.all([
    supabase
      .from("agri_diseases")
      .select("id,name_ar,name_fr,name_en,scientific_name,symptoms,causes,treatment,prevention,severity")
      .or(orClause(["name_ar", "name_fr", "name_en", "symptoms", "scientific_name"]))
      .limit(5),
    supabase
      .from("agri_pests")
      .select("id,name_ar,name_fr,name_en,scientific_name,symptoms,damage,control_methods,severity")
      .or(orClause(["name_ar", "name_fr", "name_en", "symptoms", "scientific_name"]))
      .limit(5),
    supabase
      .from("agri_weeds")
      .select("id,name_ar,name_fr,name_en,scientific_name,description,control_chemical,control_cultural")
      .or(orClause(["name_ar", "name_fr", "name_en", "description", "scientific_name"]))
      .limit(3),
    supabase
      .from("agri_pesticides")
      .select("id,name_ar,name_fr,active_ingredient,target_pests,target_diseases,dosage,safety_period_days,product_id")
      .or(orClause(["name_ar", "name_fr", "active_ingredient", "target_pests", "target_diseases"]))
      .limit(6),
    supabase
      .from("agri_fertilizers")
      .select("id,name_ar,name_fr,type,npk,dosage,application_method,product_id")
      .or(orClause(["name_ar", "name_fr", "type", "npk"]))
      .limit(4),
  ]);

  // Fetch related products for stock info
  const productIds = [
    ...(pesticidesR.data ?? []).map((p: any) => p.product_id),
    ...(fertilizersR.data ?? []).map((p: any) => p.product_id),
  ].filter(Boolean);

  let products: any[] = [];
  if (productIds.length > 0) {
    const { data } = await supabase
      .from("products")
      .select("id,name_ar,name_fr,sku,stock_quantity,sale_price")
      .in("id", productIds);
    products = data ?? [];
  }

  return {
    diseases: diseasesR.data ?? [],
    pests: pestsR.data ?? [],
    weeds: weedsR.data ?? [],
    treatments: [...(pesticidesR.data ?? []), ...(fertilizersR.data ?? [])],
    products,
  };
}

const DiagnosisSchema = z.object({
  diagnosis: z.string(),
  confidence: z.enum(["low", "medium", "high"]),
  matched_ids: z.object({
    disease_ids: z.array(z.string()).nullable(),
    pest_ids: z.array(z.string()).nullable(),
    weed_ids: z.array(z.string()).nullable(),
    treatment_ids: z.array(z.string()).nullable(),
  }),
  symptoms: z.array(z.string()),
  causes: z.array(z.string()),
  treatments_chemical: z.array(z.string()),
  treatments_organic: z.array(z.string()),
  treatments_cultural: z.array(z.string()),
  prevention: z.array(z.string()),
  alternatives: z.array(z.string()),
});

export const diagnosePlant = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) => Input.parse(raw))
  .handler(async ({ data, context }) => {
    const key = process.env.LOVABLE_API_KEY;
    if (!key) throw new Error("Missing LOVABLE_API_KEY");

    // RAG: retrieve knowledge base context
    const kb = await retrieveKnowledge(context.supabase, data.plant, data.description);

    const gateway = createLovableAiGatewayProvider(key);
    const model = gateway("google/gemini-3-flash-preview");

    const langInstr =
      data.lang === "fr" ? "Réponds en français." :
      data.lang === "en" ? "Reply in English." : "أجب باللغة العربية.";

    const kbContext = `
[KNOWLEDGE BASE CONTEXT - use these entries as authoritative reference when relevant]

DISEASES (${kb.diseases.length}):
${kb.diseases.map((d: any) => `- id=${d.id} | ${d.name_ar} / ${d.name_fr ?? ""} (${d.scientific_name ?? ""}) | symptoms: ${d.symptoms ?? ""} | treatment: ${d.treatment ?? ""}`).join("\n") || "(none)"}

PESTS (${kb.pests.length}):
${kb.pests.map((p: any) => `- id=${p.id} | ${p.name_ar} / ${p.name_fr ?? ""} (${p.scientific_name ?? ""}) | symptoms: ${p.symptoms ?? ""} | control: ${p.control_methods ?? ""}`).join("\n") || "(none)"}

WEEDS (${kb.weeds.length}):
${kb.weeds.map((w: any) => `- id=${w.id} | ${w.name_ar} / ${w.name_fr ?? ""} | ${w.description ?? ""}`).join("\n") || "(none)"}

AVAILABLE TREATMENTS (${kb.treatments.length}):
${kb.treatments.map((t: any) => `- id=${t.id} | ${t.name_ar} | ${t.active_ingredient ?? t.npk ?? t.type ?? ""} | dosage: ${t.dosage ?? ""}`).join("\n") || "(none)"}
`.trim();

    const system = `You are an expert agricultural diagnostician for Haytam AGRI. ${langInstr}
Base your diagnosis STRICTLY on the KNOWLEDGE BASE CONTEXT below when the case matches. Cite matched entry IDs in matched_ids.
If no strong match exists, provide best-effort diagnosis and mark confidence as "low".
Be concise, actionable, and evidence-based. Always suggest chemical + organic + cultural options.

${kbContext}`;

    const userContent: Array<
      { type: "text"; text: string } | { type: "image"; image: string }
    > = [
      {
        type: "text",
        text: `Plant: ${data.plant || "unspecified"}\nSymptoms/Description: ${data.description}`,
      },
    ];
    if (data.imageDataUrl) userContent.push({ type: "image", image: data.imageDataUrl });

    try {
      const { output } = await generateText({
        model,
        output: Output.object({ schema: DiagnosisSchema }),
        messages: [
          { role: "system", content: system },
          { role: "user", content: userContent },
        ],
      });

      // Enrich with product availability for suggested treatments
      const treatmentIds = output.matched_ids?.treatment_ids ?? [];
      const suggestedProducts = kb.products.filter((p: any) =>
        kb.treatments.some(
          (t: any) => treatmentIds.includes(t.id) && t.product_id === p.id,
        ),
      );

      return {
        ...output,
        knowledge_base: {
          diseases: kb.diseases,
          pests: kb.pests,
          weeds: kb.weeds,
          treatments: kb.treatments,
        },
        suggested_products: suggestedProducts.length > 0 ? suggestedProducts : kb.products,
      };
    } catch (e: any) {
      throw new Error(e?.message ?? "AI diagnosis failed");
    }
  });

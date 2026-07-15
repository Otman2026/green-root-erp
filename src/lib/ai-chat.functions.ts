import { createServerFn } from "@tanstack/react-start";
import { generateText } from "ai";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { createLovableAiGatewayProvider } from "./ai-gateway.server";

const AskInput = z.object({
  conversation_id: z.string().uuid().nullable().optional(),
  message: z.string().min(1),
  lang: z.enum(["ar", "fr", "en"]).default("ar"),
});

function tokenize(text: string): string[] {
  return text.toLowerCase().replace(/[^\p{L}\p{N}\s]/gu, " ").split(/\s+/).filter((w) => w.length >= 3).slice(0, 10);
}

async function retrieveContext(supabase: any, query: string) {
  const tokens = tokenize(query);
  if (tokens.length === 0) return "";
  const or = (cols: string[]) => tokens.flatMap((t) => cols.map((c) => `${c}.ilike.%${t}%`)).join(",");

  try {
    const [plants, diseases, pests, pesticides, fertilizers, treatments] = await Promise.all([
      supabase.from("agri_plants")
        .select("common_name_ar,common_name_fr,scientific_name,family,season,soil,water_needs,description")
        .or(or(["common_name_ar", "common_name_fr", "scientific_name", "family", "description"])).limit(3),
      supabase.from("agri_diseases")
        .select("name_ar,name_fr,symptoms,prevention,description,severity")
        .or(or(["name_ar", "name_fr", "symptoms", "description"])).limit(3),
      supabase.from("agri_pests")
        .select("name_ar,name_fr,damage,life_cycle,description")
        .or(or(["name_ar", "name_fr", "damage", "description"])).limit(3),
      supabase.from("agri_pesticides")
        .select("name_ar,trade_name,active_ingredient,target_pests,target_diseases,dosage,pre_harvest_interval_days")
        .or(or(["name_ar", "trade_name", "active_ingredient", "target_pests", "target_diseases"])).limit(4),
      supabase.from("agri_fertilizers")
        .select("name_ar,brand,type,n_percent,p_percent,k_percent,dosage,application_method")
        .or(or(["name_ar", "brand", "type"])).limit(3),
      supabase.from("agri_treatments")
        .select("title,method,active_ingredient,dosage,frequency,safety_period,description")
        .or(or(["title", "description", "active_ingredient", "method"])).limit(4),
    ]);

    const parts: string[] = [];
    if (plants.data?.length) parts.push(`PLANTS:\n${plants.data.map((x: any) => `- ${x.common_name_ar} (${x.scientific_name ?? ""}): season=${x.season ?? ""}, water=${x.water_needs ?? ""}`).join("\n")}`);
    if (diseases.data?.length) parts.push(`DISEASES:\n${diseases.data.map((x: any) => `- ${x.name_ar}: symptoms=${x.symptoms ?? ""}; prevention=${x.prevention ?? ""}`).join("\n")}`);
    if (pests.data?.length) parts.push(`PESTS:\n${pests.data.map((x: any) => `- ${x.name_ar}: damage=${x.damage ?? ""}; life-cycle=${x.life_cycle ?? ""}`).join("\n")}`);
    if (pesticides.data?.length) parts.push(`PESTICIDES:\n${pesticides.data.map((x: any) => `- ${x.name_ar} (${x.active_ingredient ?? ""}): dosage=${x.dosage ?? ""}, PHI=${x.pre_harvest_interval_days ?? "?"}d, targets: ${x.target_pests ?? ""} ${x.target_diseases ?? ""}`).join("\n")}`);
    if (fertilizers.data?.length) parts.push(`FERTILIZERS:\n${fertilizers.data.map((x: any) => `- ${x.name_ar} (NPK ${x.n_percent ?? "?"}-${x.p_percent ?? "?"}-${x.k_percent ?? "?"}): dosage=${x.dosage ?? ""}`).join("\n")}`);
    if (treatments.data?.length) parts.push(`TREATMENTS:\n${treatments.data.map((x: any) => `- ${x.title}: ${x.method ?? ""}, ${x.active_ingredient ?? ""}, dosage=${x.dosage ?? ""}, freq=${x.frequency ?? ""}`).join("\n")}`);

    return parts.join("\n\n");
  } catch {
    return "";
  }
}

export const askAgriAI = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) => AskInput.parse(raw))
  .handler(async ({ data, context }) => {
    const key = process.env.LOVABLE_API_KEY;
    if (!key) throw new Error("Missing LOVABLE_API_KEY");
    const { supabase, userId } = context;

    let conversationId = data.conversation_id ?? null;
    if (!conversationId) {
      const { data: conv, error } = await supabase.from("ai_conversations")
        .insert({ user_id: userId, title: data.message.slice(0, 60) })
        .select("id").single();
      if (error) throw new Error(error.message);
      conversationId = conv.id;
    }

    await supabase.from("ai_messages").insert({
      conversation_id: conversationId, role: "user", content: data.message,
    });

    const { data: history } = await supabase.from("ai_messages")
      .select("role,content").eq("conversation_id", conversationId)
      .order("created_at", { ascending: true }).limit(20);

    const kbContext = await retrieveContext(supabase, data.message);
    const langInstr = data.lang === "fr" ? "Réponds en français." : data.lang === "en" ? "Reply in English." : "أجب باللغة العربية.";

    const system = `You are Haytam AGRI's expert agricultural assistant. ${langInstr}
Answer questions about: plants, diseases, pests, weeds, fertilizers, pesticides, seeds, planting seasons, harvest, dosages, safety intervals, agricultural best practices.
Use the KNOWLEDGE BASE CONTEXT below as primary reference. Cite dosages/methods when available. Be concise and practical.

KNOWLEDGE BASE CONTEXT:
${kbContext || "(no matching entries - use general expertise)"}`;

    const messages = [
      { role: "system" as const, content: system },
      ...((history ?? []) as Array<{ role: "user" | "assistant"; content: string }>).map((m) => ({ role: m.role, content: m.content })),
    ];

    const gateway = createLovableAiGatewayProvider(key);
    const model = gateway("google/gemini-3-flash-preview");
    const { text } = await generateText({ model, messages });

    await supabase.from("ai_messages").insert({
      conversation_id: conversationId, role: "assistant", content: text,
    });

    return { conversation_id: conversationId, reply: text };
  });

export const listConversations = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase.from("ai_conversations")
      .select("id,title,created_at,updated_at")
      .order("updated_at", { ascending: false }).limit(50);
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const getConversation = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) => z.object({ id: z.string().uuid() }).parse(raw))
  .handler(async ({ data, context }) => {
    const { data: msgs, error } = await context.supabase.from("ai_messages")
      .select("id,role,content,created_at").eq("conversation_id", data.id)
      .order("created_at", { ascending: true });
    if (error) throw new Error(error.message);
    return msgs ?? [];
  });

export const deleteConversation = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) => z.object({ id: z.string().uuid() }).parse(raw))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("ai_conversations").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

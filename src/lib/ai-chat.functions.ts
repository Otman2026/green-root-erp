import { createServerFn } from "@tanstack/react-start";
import { generateText } from "ai";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { createLovableAiGatewayProvider } from "./ai-gateway.server";

const MsgSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string(),
});

const AskInput = z.object({
  conversation_id: z.string().uuid().nullable().optional(),
  message: z.string().min(1),
  lang: z.enum(["ar", "fr", "en"]).default("ar"),
});

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .split(/\s+/)
    .filter((w) => w.length >= 3)
    .slice(0, 10);
}

async function retrieveContext(supabase: any, query: string) {
  const tokens = tokenize(query);
  if (tokens.length === 0) return "";
  const or = (cols: string[]) =>
    tokens.flatMap((t) => cols.map((c) => `${c}.ilike.%${t}%`)).join(",");

  const [plants, diseases, pests, treatments] = await Promise.all([
    supabase.from("agri_plants")
      .select("name_ar,name_fr,scientific_name,category,planting_season,harvest_season")
      .or(or(["name_ar", "name_fr", "scientific_name", "category"])).limit(3),
    supabase.from("agri_diseases")
      .select("name_ar,name_fr,symptoms,treatment,prevention")
      .or(or(["name_ar", "name_fr", "symptoms"])).limit(3),
    supabase.from("agri_pests")
      .select("name_ar,name_fr,symptoms,control_methods")
      .or(or(["name_ar", "name_fr", "symptoms"])).limit(3),
    supabase.from("agri_pesticides")
      .select("name_ar,active_ingredient,target_pests,target_diseases,dosage,safety_period_days")
      .or(or(["name_ar", "active_ingredient", "target_pests", "target_diseases"])).limit(4),
  ]);

  const parts: string[] = [];
  if (plants.data?.length) parts.push(`PLANTS:\n${plants.data.map((x: any) => `- ${x.name_ar} (${x.scientific_name ?? ""}): season=${x.planting_season ?? ""}`).join("\n")}`);
  if (diseases.data?.length) parts.push(`DISEASES:\n${diseases.data.map((x: any) => `- ${x.name_ar}: symptoms=${x.symptoms ?? ""}; treatment=${x.treatment ?? ""}`).join("\n")}`);
  if (pests.data?.length) parts.push(`PESTS:\n${pests.data.map((x: any) => `- ${x.name_ar}: ${x.symptoms ?? ""}; control=${x.control_methods ?? ""}`).join("\n")}`);
  if (treatments.data?.length) parts.push(`TREATMENTS:\n${treatments.data.map((x: any) => `- ${x.name_ar} (${x.active_ingredient ?? ""}): dosage=${x.dosage ?? ""}, PHI=${x.safety_period_days ?? "?"}d`).join("\n")}`);

  return parts.join("\n\n");
}

export const askAgriAI = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) => AskInput.parse(raw))
  .handler(async ({ data, context }) => {
    const key = process.env.LOVABLE_API_KEY;
    if (!key) throw new Error("Missing LOVABLE_API_KEY");
    const { supabase, userId } = context;

    // Ensure conversation
    let conversationId = data.conversation_id ?? null;
    if (!conversationId) {
      const { data: conv, error } = await supabase
        .from("ai_conversations")
        .insert({ user_id: userId, title: data.message.slice(0, 60) })
        .select("id")
        .single();
      if (error) throw new Error(error.message);
      conversationId = conv.id;
    }

    // Save user message
    await supabase.from("ai_messages").insert({
      conversation_id: conversationId,
      role: "user",
      content: data.message,
    });

    // Load history
    const { data: history } = await supabase
      .from("ai_messages")
      .select("role,content")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true })
      .limit(20);

    // RAG
    const kbContext = await retrieveContext(supabase, data.message);

    const langInstr =
      data.lang === "fr" ? "Réponds en français." :
      data.lang === "en" ? "Reply in English." : "أجب باللغة العربية.";

    const system = `You are Haytam AGRI's expert agricultural assistant. ${langInstr}
Answer questions about: plants, diseases, pests, weeds, fertilizers, pesticides, seeds, planting seasons, harvest, dosages, safety intervals, and agricultural best practices.
Use the KNOWLEDGE BASE CONTEXT below as primary reference when relevant. Be concise, practical, and cite specific dosages/methods when available.

KNOWLEDGE BASE CONTEXT:
${kbContext || "(no relevant entries found - use general expertise)"}`;

    const messages = [
      { role: "system" as const, content: system },
      ...((history ?? []) as Array<{ role: "user" | "assistant"; content: string }>).map((m) => ({
        role: m.role,
        content: m.content,
      })),
    ];

    const gateway = createLovableAiGatewayProvider(key);
    const model = gateway("google/gemini-3-flash-preview");
    const { text } = await generateText({ model, messages });

    // Save assistant reply
    await supabase.from("ai_messages").insert({
      conversation_id: conversationId,
      role: "assistant",
      content: text,
    });

    return { conversation_id: conversationId, reply: text };
  });

export const listConversations = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("ai_conversations")
      .select("id,title,created_at,updated_at")
      .order("updated_at", { ascending: false })
      .limit(50);
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const getConversation = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) => z.object({ id: z.string().uuid() }).parse(raw))
  .handler(async ({ data, context }) => {
    const { data: msgs, error } = await context.supabase
      .from("ai_messages")
      .select("id,role,content,created_at")
      .eq("conversation_id", data.id)
      .order("created_at", { ascending: true });
    if (error) throw new Error(error.message);
    return msgs ?? [];
  });

export const deleteConversation = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) => z.object({ id: z.string().uuid() }).parse(raw))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("ai_conversations")
      .delete()
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

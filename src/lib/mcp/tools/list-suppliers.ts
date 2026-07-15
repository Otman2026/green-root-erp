import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForCaller, textError } from "../supabase";

export default defineTool({
  name: "list_suppliers",
  title: "List suppliers",
  description: "List or search suppliers. Returns id, name, phone, city, balance.",
  inputSchema: {
    query: z.string().trim().optional().describe("Optional match against name / phone / city."),
    limit: z.number().int().min(1).max(100).optional(),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ query, limit }, ctx) => {
    if (!ctx.isAuthenticated()) return textError("Not authenticated");
    const sb = supabaseForCaller(ctx);
    let q = sb
      .from("suppliers")
      .select("id,name,phone,city,contact_person,balance,status")
      .order("name")
      .limit(limit ?? 25);
    if (query && query.length) {
      const like = `%${query}%`;
      q = q.or(`name.ilike.${like},phone.ilike.${like},city.ilike.${like}`);
    }
    const { data, error } = await q;
    if (error) return textError(error.message);
    return {
      content: [{ type: "text", text: `Found ${data?.length ?? 0} supplier(s).` }],
      structuredContent: { suppliers: data ?? [] },
    };
  },
});

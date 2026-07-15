import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForCaller, textError } from "../supabase";

export default defineTool({
  name: "list_customers",
  title: "List customers",
  description: "List or search customers (name, phone, city). Returns id, name, phone, balance, type.",
  inputSchema: {
    query: z.string().trim().optional().describe("Optional text to match against name / phone / city."),
    limit: z.number().int().min(1).max(100).optional().describe("Max rows (default 25)."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ query, limit }, ctx) => {
    if (!ctx.isAuthenticated()) return textError("Not authenticated");
    const sb = supabaseForCaller(ctx);
    let q = sb
      .from("customers")
      .select("id,name,phone,city,balance,credit_limit,customer_type,is_active")
      .eq("is_active", true)
      .order("name")
      .limit(limit ?? 25);
    if (query && query.length) {
      const like = `%${query}%`;
      q = q.or(`name.ilike.${like},phone.ilike.${like},city.ilike.${like}`);
    }
    const { data, error } = await q;
    if (error) return textError(error.message);
    return {
      content: [{ type: "text", text: `Found ${data?.length ?? 0} customer(s).` }],
      structuredContent: { customers: data ?? [] },
    };
  },
});

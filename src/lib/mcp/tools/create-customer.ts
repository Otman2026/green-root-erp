import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForCaller, textError } from "../supabase";

export default defineTool({
  name: "create_customer",
  title: "Create customer",
  description: "Add a new customer to the CRM. Requires at least a name.",
  inputSchema: {
    name: z.string().trim().min(1).describe("Customer full name."),
    phone: z.string().trim().optional(),
    email: z.string().trim().email().optional(),
    city: z.string().trim().optional(),
    address: z.string().trim().optional(),
    notes: z.string().trim().optional(),
  },
  annotations: { readOnlyHint: false, destructiveHint: false, openWorldHint: false },
  handler: async (input, ctx) => {
    if (!ctx.isAuthenticated()) return textError("Not authenticated");
    const sb = supabaseForCaller(ctx);
    const { data, error } = await sb
      .from("customers")
      .insert({
        name: input.name,
        phone: input.phone ?? null,
        email: input.email ?? null,
        city: input.city ?? null,
        address: input.address ?? null,
        notes: input.notes ?? null,
        created_by: ctx.getUserId(),
      })
      .select("id,name,phone,email,city")
      .single();
    if (error) return textError(error.message);
    return {
      content: [{ type: "text", text: `Created customer ${data.name} (${data.id}).` }],
      structuredContent: { customer: data },
    };
  },
});

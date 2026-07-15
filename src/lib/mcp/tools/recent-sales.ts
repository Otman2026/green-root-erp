import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForCaller, textError } from "../supabase";

export default defineTool({
  name: "recent_sales",
  title: "Recent sales",
  description: "Return the most recent sales invoices with totals, status and customer id.",
  inputSchema: {
    limit: z.number().int().min(1).max(50).optional().describe("Max rows (default 10)."),
    status: z
      .enum(["draft", "confirmed", "paid", "partial", "cancelled", "refunded"])
      .optional()
      .describe("Filter by status."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ limit, status }, ctx) => {
    if (!ctx.isAuthenticated()) return textError("Not authenticated");
    const sb = supabaseForCaller(ctx);
    let q = sb
      .from("sales")
      .select("id,invoice_no,customer_id,total,paid,balance,status,payment_method,type,created_at")
      .order("created_at", { ascending: false })
      .limit(limit ?? 10);
    if (status) q = q.eq("status", status as any);
    const { data, error } = await q;
    if (error) return textError(error.message);
    return {
      content: [{ type: "text", text: `${data?.length ?? 0} sale(s).` }],
      structuredContent: { sales: data ?? [] },
    };
  },
});

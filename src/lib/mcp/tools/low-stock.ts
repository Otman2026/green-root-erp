import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForCaller, textError } from "../supabase";

export default defineTool({
  name: "low_stock_products",
  title: "Low-stock products",
  description:
    "List products whose stock_quantity is at or below their min_stock_alert threshold — items that need reordering.",
  inputSchema: {
    limit: z.number().int().min(1).max(100).optional().describe("Max rows (default 25)."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ limit }, ctx) => {
    if (!ctx.isAuthenticated()) return textError("Not authenticated");
    const sb = supabaseForCaller(ctx);
    // PostgREST can't compare two columns directly; fetch active products
    // ordered by stock and filter in code.
    const { data, error } = await sb
      .from("products")
      .select("id,name,name_ar,sku,stock_quantity,min_stock_alert,unit")
      .eq("status", "active")
      .order("stock_quantity", { ascending: true })
      .limit((limit ?? 25) * 4);
    if (error) return textError(error.message);
    const low = (data ?? [])
      .filter((p: any) => Number(p.stock_quantity) <= Number(p.min_stock_alert))
      .slice(0, limit ?? 25);
    return {
      content: [{ type: "text", text: `${low.length} product(s) at or below reorder threshold.` }],
      structuredContent: { products: low },
    };
  },
});

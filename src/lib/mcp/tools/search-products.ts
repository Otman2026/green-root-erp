import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForCaller, textError } from "../supabase";

export default defineTool({
  name: "search_products",
  title: "Search products",
  description:
    "Search products in the Haytam AGRI catalog by name, SKU, barcode, or trade name. Returns id, name, SKU, price, stock, unit.",
  inputSchema: {
    query: z.string().trim().min(1).describe("Text to match against name / name_ar / sku / barcode / trade_name."),
    limit: z.number().int().min(1).max(50).optional().describe("Max rows (default 20)."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ query, limit }, ctx) => {
    if (!ctx.isAuthenticated()) return textError("Not authenticated");
    const sb = supabaseForCaller(ctx);
    const like = `%${query}%`;
    const { data, error } = await sb
      .from("products")
      .select("id,name,name_ar,sku,barcode,trade_name,selling_price,purchase_price,stock_quantity,unit,currency,status")
      .or(
        `name.ilike.${like},name_ar.ilike.${like},sku.ilike.${like},barcode.ilike.${like},trade_name.ilike.${like}`,
      )
      .limit(limit ?? 20);
    if (error) return textError(error.message);
    return {
      content: [{ type: "text", text: `Found ${data?.length ?? 0} products.` }],
      structuredContent: { products: data ?? [] },
    };
  },
});

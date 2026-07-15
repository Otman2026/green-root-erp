import { auth, defineMcp } from "@lovable.dev/mcp-js";
import searchProductsTool from "./tools/search-products";
import lowStockTool from "./tools/low-stock";
import listCustomersTool from "./tools/list-customers";
import listSuppliersTool from "./tools/list-suppliers";
import recentSalesTool from "./tools/recent-sales";
import createCustomerTool from "./tools/create-customer";

// The OAuth issuer must be the direct Supabase host — the `.lovable.cloud`
// proxy is rejected by mcp-js (RFC 8414 issuer mismatch).
const projectRef = import.meta.env.VITE_SUPABASE_PROJECT_ID ?? "project-ref-unset";

export default defineMcp({
  name: "haytam-agri-mcp",
  title: "Haytam AGRI",
  version: "0.1.0",
  instructions:
    "Tools for the Haytam AGRI ERP: search the product catalog, spot low-stock items, look up customers and suppliers, review recent sales, and create new customers. All tools run as the signed-in user with RLS enforced.",
  auth: auth.oauth.issuer({
    issuer: `https://${projectRef}.supabase.co/auth/v1`,
    acceptedAudiences: "authenticated",
  }),
  tools: [
    searchProductsTool,
    lowStockTool,
    listCustomersTool,
    listSuppliersTool,
    recentSalesTool,
    createCustomerTool,
  ],
});

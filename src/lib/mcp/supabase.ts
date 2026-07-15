import { createClient } from "@supabase/supabase-js";
import type { ToolContext } from "@lovable.dev/mcp-js";

// Per-request Supabase client that forwards the caller's OAuth bearer token
// so RLS runs as the authenticated app user.
export function supabaseForCaller(ctx: ToolContext) {
  const url = process.env.SUPABASE_URL!;
  const anon = process.env.SUPABASE_PUBLISHABLE_KEY!;
  const token = ctx.getToken();
  return createClient(url, anon, {
    global: {
      // Send Authorization AND apikey; the generated client's fetch wrapper
      // strips a duplicate Bearer <apikey> header for new-style keys.
      fetch: (input, init) => {
        const headers = new Headers(init?.headers);
        headers.set("apikey", anon);
        headers.set("Authorization", `Bearer ${token}`);
        return fetch(input, { ...init, headers });
      },
    },
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export function textError(message: string) {
  return { content: [{ type: "text" as const, text: message }], isError: true };
}

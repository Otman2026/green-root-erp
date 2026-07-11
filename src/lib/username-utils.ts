import { supabase } from "@/integrations/supabase/client";

export const INTERNAL_EMAIL_DOMAIN = "haytam.local";

export function normalizeUsername(input: string): string {
  return input.toLowerCase().trim().replace(/[^a-z0-9_.]+/g, "_").replace(/^_+|_+$/g, "");
}

export function usernameToEmail(username: string): string {
  return `${normalizeUsername(username)}@${INTERNAL_EMAIL_DOMAIN}`;
}

/** Returns true if the username is available (case-insensitive). */
export async function isUsernameAvailable(username: string): Promise<boolean> {
  const u = normalizeUsername(username);
  if (u.length < 3) return false;
  const { data, error } = await supabase
    .from("profiles")
    .select("id")
    .ilike("username", u)
    .maybeSingle();
  if (error && error.code !== "PGRST116") return false;
  return !data;
}

/** Suggests up to 6 available usernames based on a candidate. */
export async function suggestUsernames(base: string): Promise<string[]> {
  const clean = normalizeUsername(base) || "user";
  const year = new Date().getFullYear();
  const candidates = [
    `${clean}01`, `${clean}02`, `${clean}${year}`,
    `${clean}.store`, `${clean}_agri`, `${clean}${Math.floor(Math.random() * 900 + 100)}`,
    `${clean}_${Math.floor(Math.random() * 90 + 10)}`, `agri.${clean}`, `${clean}.pro`,
  ];
  const out: string[] = [];
  for (const c of candidates) {
    if (out.length >= 6) break;
    if (await isUsernameAvailable(c)) out.push(c);
  }
  return out;
}

/**
 * Resolves a login identifier (username, phone, or email) to an email that
 * Supabase can authenticate. If it looks like an email, returns as-is; if a
 * phone-like string, returns as-is (used as email fallback); otherwise treats
 * as username and maps to the internal domain.
 */
export function loginIdentifierToEmail(identifier: string): string {
  const v = identifier.trim();
  if (v.includes("@")) return v.toLowerCase();
  return usernameToEmail(v);
}

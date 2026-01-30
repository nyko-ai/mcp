// Supabase client for future use
// Currently, patterns are fetched directly from GitHub Raw
// This module will be used when we migrate to Supabase for pattern storage

import type { Env } from "../mcp/types";

export function getSupabaseConfig(env: Env) {
  if (!env.SUPABASE_URL || !env.SUPABASE_ANON_KEY) {
    return null;
  }

  return {
    url: env.SUPABASE_URL,
    anonKey: env.SUPABASE_ANON_KEY,
  };
}

// TODO: Implement Supabase pattern storage
// export async function fetchPatternFromSupabase(patternId: string, env: Env): Promise<Pattern | null> {
//   const config = getSupabaseConfig(env);
//   if (!config) return null;
//
//   // Fetch from patterns table
//   // ...
// }

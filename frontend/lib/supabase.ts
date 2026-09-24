import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

/**
 * Browser-side Supabase client.
 * Uses the anon key — all access is governed by RLS policies.
 * We use this only for Auth (Google OAuth login/logout/session).
 * All data fetching goes through the Flask backend which uses the service role key.
 */
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

import { createBrowserClient } from "@supabase/ssr";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

/**
 * Browser-side Supabase client using @supabase/ssr
 * This works correctly with Next.js App Router for both
 * local development and production (Vercel).
 */
export const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey);

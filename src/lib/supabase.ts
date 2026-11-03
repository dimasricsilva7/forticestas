import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

/**
 * Public browser client. Never put the Supabase service-role key in this file
 * or expose it through a NEXT_PUBLIC_ environment variable.
 */
export const supabase =
  url && anonKey ? createClient(url, anonKey) : null;

import { createBrowserClient } from "@supabase/ssr";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://xmuiudkldqzxqbocbuwb.supabase.co";
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || "sb_publishable_PeroVP9Xv7r1iaKsqdxbqQ_jn7cpRVX";

export const createClient = () =>
  createBrowserClient(
    supabaseUrl,
    supabaseKey
  );

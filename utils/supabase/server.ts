import { createServerClient, type CookieOptions } from "@supabase/ssr";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://xmuiudkldqzxqbocbuwb.supabase.co";
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || "sb_publishable_PeroVP9Xv7r1iaKsqdxbqQ_jn7cpRVX";

export interface CookieItem {
  name: string;
  value: string;
  options?: CookieOptions;
}

export interface CookieStoreLike {
  getAll: () => { name: string; value: string }[] | Promise<{ name: string; value: string }[]>;
  set?: (name: string, value: string, options?: any) => void;
}

export const createClient = (cookieStore: any) => {
  return createServerClient(
    supabaseUrl!,
    supabaseKey!,
    {
      cookies: {
        getAll() {
          return typeof cookieStore?.getAll === "function" ? cookieStore.getAll() : [];
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              if (typeof cookieStore?.set === "function") {
                cookieStore.set(name, value, options);
              }
            });
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing user sessions.
          }
        },
      },
    },
  );
};

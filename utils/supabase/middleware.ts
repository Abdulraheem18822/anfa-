import { createServerClient } from "@supabase/ssr";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://xmuiudkldqzxqbocbuwb.supabase.co";
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || "sb_publishable_PeroVP9Xv7r1iaKsqdxbqQ_jn7cpRVX";

export const createClient = (request: any, response?: any) => {
  let supabaseResponse = response || {
    headers: new Headers(),
    cookies: {
      set: (name: string, value: string, options?: any) => {},
    },
  };

  const supabase = createServerClient(
    supabaseUrl!,
    supabaseKey!,
    {
      cookies: {
        getAll() {
          return request?.cookies?.getAll ? request.cookies.getAll() : [];
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            if (request?.cookies?.set) {
              request.cookies.set(name, value);
            }
            if (supabaseResponse?.cookies?.set) {
              supabaseResponse.cookies.set(name, value, options);
            }
          });
        },
      },
    },
  );

  return { supabase, response: supabaseResponse };
};

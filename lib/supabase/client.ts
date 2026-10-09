import { createBrowserClient } from "@supabase/ssr";

/**
 * Supabase client cho browser/client components.
 * Dùng anon key - RLS sẽ giới hạn quyền truy cập.
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

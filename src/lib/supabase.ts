import { createBrowserClient } from "@supabase/ssr";
import { Database } from "./database.types";

function cleanEnv(value: string | undefined): string {
  return (value || "").trim().replace(/\r?\n/g, "");
}

export const createClient = () =>
  createBrowserClient<Database>(
    cleanEnv(process.env.NEXT_PUBLIC_SUPABASE_URL),
    cleanEnv(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
  );

export type TypedSupabaseClient = ReturnType<typeof createClient>;

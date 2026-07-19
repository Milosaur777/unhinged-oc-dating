import { createClient } from "@supabase/supabase-js";
import { Database } from "./database.types";

function cleanEnv(value: string | undefined): string {
  return (value || "").trim().replace(/\r?\n/g, "");
}

export function createServiceRoleClient() {
  const url = cleanEnv(process.env.NEXT_PUBLIC_SUPABASE_URL);
  const key = cleanEnv(process.env.SUPABASE_SERVICE_ROLE_KEY);

  if (!key) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY is not set");
  }

  return createClient<Database>(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";

  if (!code) {
    return NextResponse.redirect(new URL("/auth/login", request.url));
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.exchangeCodeForSession(code);

  if (error || !data.user) {
    return NextResponse.redirect(new URL("/auth/login?error=oauth", request.url));
  }

  const user = data.user;
  const displayName =
    user.user_metadata?.name ||
    user.user_metadata?.full_name ||
    user.email?.split("@")[0] ||
    "User";

  await supabase.from("profiles").upsert(
    {
      id: user.id,
      username: user.email?.split("@")[0] || `user_${user.id.slice(0, 8)}`,
      display_name: displayName,
      avatar_url: user.user_metadata?.avatar_url || null,
      bio: null,
      creator_name: null,
      creator_bio: null,
      creator_avatar_url: null,
      creator_discord: null,
      creator_website: null,
      creator_visible: true,
    },
    { onConflict: "id" }
  );

  return NextResponse.redirect(new URL(next, request.url));
}

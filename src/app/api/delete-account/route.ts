import { NextRequest, NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase-service-role";

function extractStoragePath(publicUrl: string, bucket = "oc-images"): string {
  const marker = `/object/public/${bucket}/`;
  const idx = publicUrl.indexOf(marker);
  if (idx === -1) return "";
  return publicUrl.slice(idx + marker.length);
}

export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const authHeader = request.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.slice(7);
    const supabase = createServiceRoleClient();

    // Verify token and get user
    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    if (userError || !userData.user) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const userId = userData.user.id;

    // 1. Get all OC IDs for this user
    const { data: userOcs } = await supabase
      .from("ocs")
      .select("id, image_url, images")
      .eq("user_id", userId);

    const ocIds = userOcs?.map((oc) => oc.id) ?? [];

    // Collect all image URLs to delete from storage later
    const imageUrlsToDelete: string[] = [];

    // OC avatars and gallery images
    for (const oc of userOcs ?? []) {
      if (oc.image_url) imageUrlsToDelete.push(oc.image_url);
      if (oc.images) imageUrlsToDelete.push(...oc.images);
    }

    // Get profile data for creator images
    const { data: profile } = await supabase
      .from("profiles")
      .select("creator_header_url, creator_avatar_url")
      .eq("id", userId)
      .single();

    if (profile?.creator_header_url) imageUrlsToDelete.push(profile.creator_header_url);
    if (profile?.creator_avatar_url) imageUrlsToDelete.push(profile.creator_avatar_url);

    // Get chat images sent by this user's OCs
    if (ocIds.length > 0) {
      const { data: chatImages } = await supabase
        .from("chat_messages")
        .select("image_url")
        .in("from_oc_id", ocIds)
        .not("image_url", "is", null);

      for (const msg of chatImages ?? []) {
        if (msg.image_url) imageUrlsToDelete.push(msg.image_url);
      }
    }

    // 2. Get chat session IDs where user's OCs participate
    let chatSessionIds: string[] = [];
    if (ocIds.length > 0) {
      const { data: sessions1 } = await supabase
        .from("chat_sessions")
        .select("id")
        .in("oc1_id", ocIds);
      const { data: sessions2 } = await supabase
        .from("chat_sessions")
        .select("id")
        .in("oc2_id", ocIds);

      chatSessionIds = [
        ...(sessions1?.map((s) => s.id) ?? []),
        ...(sessions2?.map((s) => s.id) ?? []),
      ];
    }

    // 3. Delete in order (children first)

    // Chat messages
    if (chatSessionIds.length > 0) {
      await supabase.from("chat_messages").delete().in("chat_id", chatSessionIds);
    }

    // Chat sessions
    if (chatSessionIds.length > 0) {
      await supabase.from("chat_sessions").delete().in("id", chatSessionIds);
    }

    // Swipe actions (both directions)
    if (ocIds.length > 0) {
      await supabase.from("swipe_actions").delete().in("from_oc_id", ocIds);
      await supabase.from("swipe_actions").delete().in("to_oc_id", ocIds);
    }

    // Blocked pairs
    if (ocIds.length > 0) {
      await supabase.from("blocked_pairs").delete().in("blocker_oc_id", ocIds);
      await supabase.from("blocked_pairs").delete().in("blocked_oc_id", ocIds);
    }

    // Reports
    if (ocIds.length > 0) {
      await supabase.from("reports").delete().in("reported_oc_id", ocIds);
    }
    await supabase.from("reports").delete().eq("reporter_id", userId);

    // OC-related child tables
    if (ocIds.length > 0) {
      await supabase.from("oc_visible_badges").delete().in("oc_id", ocIds);
      await supabase.from("oc_badges").delete().in("oc_id", ocIds);
      await supabase.from("oc_badges").delete().in("from_oc_id", ocIds);
      await supabase.from("oc_fields").delete().in("oc_id", ocIds);
      await supabase.from("oc_open_feed").delete().in("oc_id", ocIds);
    }

    // Profile views
    await supabase.from("profile_views").delete().eq("profile_id", userId);
    await supabase.from("profile_views").delete().eq("viewer_id", userId);

    // Match preferences
    if (ocIds.length > 0) {
      await supabase.from("match_preferences").delete().in("oc_id", ocIds);
    }

    // OCs
    await supabase.from("ocs").delete().eq("user_id", userId);

    // Profile
    await supabase.from("profiles").delete().eq("id", userId);

    // Auth user
    const { error: deleteAuthError } = await supabase.auth.admin.deleteUser(userId);
    if (deleteAuthError) {
      console.error("Failed to delete auth user:", deleteAuthError);
      // Continue anyway — at least all data is gone
    }

    // 4. Delete images from storage
    const pathsToDelete = imageUrlsToDelete
      .map((url) => extractStoragePath(url))
      .filter((p) => p.length > 0);

    // Delete in batches of 100 (Supabase limit)
    for (let i = 0; i < pathsToDelete.length; i += 100) {
      const batch = pathsToDelete.slice(i, i + 100);
      const { error: storageError } = await supabase.storage.from("oc-images").remove(batch);
      if (storageError) {
        console.error("Storage deletion error:", storageError);
      }
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Delete account error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to delete account" },
      { status: 500 }
    );
  }
}

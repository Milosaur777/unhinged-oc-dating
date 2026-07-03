import { createClient } from "./supabase";
import { Tables, TablesInsert, TablesUpdate } from "./database.types";

export type { TablesInsert, TablesUpdate };

export type OC = Tables<"ocs">;
export type OCField = Tables<"oc_fields">;
export type OCOpenFeed = Tables<"oc_open_feed">;
export type Profile = Tables<"profiles">;
export type ChatSession = Tables<"chat_sessions">;
export type ChatMessage = Tables<"chat_messages">;
export type SwipeAction = Tables<"swipe_actions">;

export interface OCWithDetails {
  id: string;
  name: string;
  user_id: string;
  image_url: string | null;
  is_swipable: boolean;
  is_hidden: boolean | null;
  is_premade: boolean | null;
  brand: number | null;
  tags: string[] | null;
  truths_and_lie: string[] | null;
  sort_order: number | null;
  created_at: string | null;
  updated_at: string | null;
  fields: OCField[];
  feed: OCOpenFeed[];
  images: string[] | null;
}

export interface ChatSessionWithOCs {
  id: string;
  oc1_id: string;
  oc2_id: string;
  oc2_user_id: string;
  oc2_user_name: string | null;
  oc2_name: string | null;
  chat_level: number;
  created_at: string | null;
  images_allowed: boolean | null;
  scene_id: string | null;
  scene_name: string | null;
  oc1: OC | null;
  oc2: OC | null;
}

export interface DashboardChat {
  id: string;
  chat_level: number;
  my_oc: { id: string; name: string; image_url: string | null; user_id: string } | null;
  partner_oc: { id: string; name: string; image_url: string | null; user_id: string } | null;
  last_message: string | null;
  last_active_at: string | null;
  is_online: boolean;
}

export interface IncomingLike {
  id: string;
  from_oc_id: string;
  to_oc_id: string;
  created_at: string | null;
  liker_oc: OC | null;
  target_oc: OC | null;
}

function getClient() {
  if (typeof window === "undefined") {
    throw new Error("supabase-queries is client-only");
  }
  return createClient();
}

export async function getCurrentUser() {
  const supabase = getClient();
  const { data, error } = await supabase.auth.getUser();
  if (error) throw error;
  return data.user;
}

export async function getProfile(userId: string): Promise<Profile | null> {
  const supabase = getClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();
  if (error && error.code !== "PGRST116") throw error;
  return data;
}

export const getUserProfile = getProfile;

export async function upsertProfile(profile: TablesInsert<"profiles">) {
  const supabase = getClient();
  const { data, error } = await supabase
    .from("profiles")
    .upsert(profile, { onConflict: "id" })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export const updateProfile = upsertProfile;

export async function clearProfileField(userId: string, field: "creator_header_url" | "creator_avatar_url") {
  const supabase = getClient();
  const update: Record<string, null> = { [field]: null };
  const { error } = await supabase
    .from("profiles")
    .update(update as TablesUpdate<"profiles">)
    .eq("id", userId);
  if (error) throw error;
}

export async function getUserOCs(userId: string): Promise<OC[]> {
  const supabase = getClient();
  const { data, error } = await supabase
    .from("ocs")
    .select("*")
    .eq("user_id", userId)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function getOCById(ocId: string): Promise<OC | null> {
  const supabase = getClient();
  const { data, error } = await supabase
    .from("ocs")
    .select("*")
    .eq("id", ocId)
    .single();
  if (error && error.code !== "PGRST116") throw error;
  return data;
}

export async function getOCUserId(ocId: string): Promise<string | null> {
  const supabase = getClient();
  const { data, error } = await supabase
    .from("ocs")
    .select("user_id")
    .eq("id", ocId)
    .single();
  if (error && error.code !== "PGRST116") {
    console.error("getOCUserId error:", error);
    return null;
  }
  return data?.user_id ?? null;
}

export async function getOCWithDetails(ocId: string): Promise<OCWithDetails | null> {
  const supabase = getClient();
  const { data, error } = await supabase
    .from("ocs")
    .select("*, fields:oc_fields(*), feed:oc_open_feed(*)")
    .eq("id", ocId)
    .single();
  if (error && error.code !== "PGRST116") throw error;
  if (!data) return null;
  return {
    ...data,
    fields: (data.fields as unknown as OCField[]) ?? [],
    feed: (data.feed as unknown as OCOpenFeed[]) ?? [],
  } as OCWithDetails;
}

export interface CreateOCInput {
  oc: Omit<TablesInsert<"ocs">, "id">;
  fields: Omit<TablesInsert<"oc_fields">, "id" | "oc_id">[];
  feed?: Omit<TablesInsert<"oc_open_feed">, "id" | "oc_id">;
}

export async function createOC({ oc, fields, feed }: CreateOCInput): Promise<OCWithDetails> {
  const supabase = getClient();
  const { data: ocData, error: ocError } = await supabase
    .from("ocs")
    .insert(oc)
    .select()
    .single();
  if (ocError) throw ocError;

  const ocId = ocData.id;

  if (fields.length > 0) {
    const { error: fieldsError } = await supabase
      .from("oc_fields")
      .insert(fields.map((f, i) => ({ ...f, oc_id: ocId, sort_order: i })));
    if (fieldsError) throw fieldsError;
  }

  if (feed) {
    const { error: feedError } = await supabase
      .from("oc_open_feed")
      .insert({ ...feed, oc_id: ocId });
    if (feedError) throw feedError;
  }

  return getOCWithDetails(ocId) as Promise<OCWithDetails>;
}

export interface UpdateOCInput {
  ocId: string;
  oc: TablesInsert<"ocs">;
  fields: Omit<TablesInsert<"oc_fields">, "id" | "oc_id">[];
  feed?: Omit<TablesInsert<"oc_open_feed">, "id" | "oc_id">;
}

export async function updateOC({ ocId, oc, fields, feed }: UpdateOCInput): Promise<OCWithDetails> {
  const supabase = getClient();
  const { error: ocError } = await supabase.from("ocs").update(oc).eq("id", ocId);
  if (ocError) throw ocError;

  const { error: deleteFieldsError } = await supabase
    .from("oc_fields")
    .delete()
    .eq("oc_id", ocId);
  if (deleteFieldsError) throw deleteFieldsError;

  if (fields.length > 0) {
    const { error: fieldsError } = await supabase
      .from("oc_fields")
      .insert(fields.map((f, i) => ({ ...f, oc_id: ocId, sort_order: i })));
    if (fieldsError) throw fieldsError;
  }

  if (feed) {
    const { error: deleteFeedError } = await supabase
      .from("oc_open_feed")
      .delete()
      .eq("oc_id", ocId);
    if (deleteFeedError) throw deleteFeedError;
    const { error: feedError } = await supabase
      .from("oc_open_feed")
      .insert({ ...feed, oc_id: ocId });
    if (feedError) throw feedError;
  }

  return getOCWithDetails(ocId) as Promise<OCWithDetails>;
}

export async function deleteOC(ocId: string) {
  const supabase = getClient();
  const { error } = await supabase.from("ocs").delete().eq("id", ocId);
  if (error) throw error;
}

export async function updateSortOrder(orders: { id: string; sort_order: number }[]) {
  const supabase = getClient();
  for (const order of orders) {
    const { error } = await supabase
      .from("ocs")
      .update({ sort_order: order.sort_order })
      .eq("id", order.id);
    if (error) throw error;
  }
}

export async function recordSwipe(fromOcId: string, toOcId: string, action: "like" | "pass") {
  const supabase = getClient();
  const { error } = await supabase.from("swipe_actions").upsert(
    {
      from_oc_id: fromOcId,
      to_oc_id: toOcId,
      action,
    },
    { onConflict: "from_oc_id,to_oc_id" }
  );
  if (error) throw error;
}

export async function resetSwipes(userId: string) {
  const supabase = getClient();
  const { data: ocs, error: ocsError } = await supabase
    .from("ocs")
    .select("id")
    .eq("user_id", userId);
  if (ocsError) throw ocsError;

  const ids = ocs?.map((o) => o.id) ?? [];
  if (ids.length === 0) return;

  const { error } = await supabase.from("swipe_actions").delete().in("from_oc_id", ids).eq("action", "pass");
  if (error) throw error;
}

export async function checkMutualLike(fromOcId: string, toOcId: string): Promise<boolean> {
  const supabase = getClient();
  const { data, error } = await supabase
    .from("swipe_actions")
    .select("id")
    .eq("from_oc_id", toOcId)
    .eq("to_oc_id", fromOcId)
    .eq("action", "like")
    .limit(1)
    .maybeSingle();
  if (error) {
    console.error("checkMutualLike error:", error);
    throw error;
  }
  return !!data;
}

export async function getSwipeCandidates(
  myOcIds: string[],
  userId: string,
  limit = 20
): Promise<OCWithDetails[]> {
  const supabase = getClient();

  const { data: swipedData, error: swipedError } = await supabase
    .from("swipe_actions")
    .select("to_oc_id")
    .in("from_oc_id", myOcIds);
  if (swipedError) throw swipedError;
  const swipedIds = new Set(swipedData?.map((s) => s.to_oc_id) ?? []);

  const { data: blockedData, error: blockedError } = await supabase
    .from("blocked_pairs")
    .select("blocked_oc_id")
    .in("blocker_oc_id", myOcIds);
  if (blockedError) throw blockedError;
  blockedData?.forEach((b) => swipedIds.add(b.blocked_oc_id));

  const { data: blockedByData, error: blockedByError } = await supabase
    .from("blocked_pairs")
    .select("blocker_oc_id")
    .in("blocked_oc_id", myOcIds);
  if (blockedByError) throw blockedByError;
  blockedByData?.forEach((b) => swipedIds.add(b.blocker_oc_id));

  const { data, error } = await supabase
    .from("ocs")
    .select("*, fields:oc_fields(*), feed:oc_open_feed(*)")
    .eq("is_swipable", true)
    .eq("is_hidden", false)
    .neq("user_id", userId)
    .not("id", "in", `(${(swipedIds.size > 0 ? Array.from(swipedIds).join(",") : "00000000-0000-0000-0000-000000000000")})`)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;

  return (data ?? []).map((oc) => ({
    ...oc,
    fields: (oc.fields as unknown as OCField[]) ?? [],
    feed: (oc.feed as unknown as OCOpenFeed[]) ?? [],
  })) as OCWithDetails[];
}

export async function getIncomingLikes(myOcIds: string[]): Promise<IncomingLike[]> {
  const supabase = getClient();
  const { data, error } = await supabase
    .from("swipe_actions")
    .select(
      "*, liker_oc:ocs!from_oc_id(id,name,image_url,user_id), target_oc:ocs!to_oc_id(id,name,image_url,user_id)"
    )
    .eq("action", "like")
    .in("to_oc_id", myOcIds);
  if (error) throw error;

  const responded = new Set<string>();
  const { data: outgoingData } = await supabase
    .from("swipe_actions")
    .select("from_oc_id,to_oc_id,action")
    .in("from_oc_id", myOcIds);
  outgoingData?.forEach((o) => responded.add(`${o.from_oc_id}-${o.to_oc_id}`));

  return (data ?? [])
    .filter((like) => !responded.has(`${like.target_oc?.id}-${like.liker_oc?.id}`))
    .map((like) => ({
      id: like.id,
      from_oc_id: like.from_oc_id,
      to_oc_id: like.to_oc_id,
      created_at: like.created_at,
      liker_oc: (like.liker_oc as unknown as OC) ?? null,
      target_oc: (like.target_oc as unknown as OC) ?? null,
    }));
}

export async function getPublicOCs(
  userId: string,
  options: { name?: string; tag?: string; excludeMine?: boolean } = {}
): Promise<OCWithDetails[]> {
  const supabase = getClient();
  let query = supabase
    .from("ocs")
    .select("*, fields:oc_fields(*), feed:oc_open_feed(*)")
    .eq("is_swipable", true);

  if (options.excludeMine !== false) {
    query = query.neq("user_id", userId);
  }

  if (options.name?.trim()) {
    query = query.ilike("name", `%${options.name.trim()}%`);
  }

  if (options.tag?.trim()) {
    query = query.contains("tags", [options.tag.trim().toLowerCase()]);
  }

  const { data, error } = await query.order("created_at", { ascending: false }).limit(100);
  if (error) throw error;

  return (data ?? []).map((oc) => ({
    ...oc,
    fields: (oc.fields as unknown as OCField[]) ?? [],
    feed: (oc.feed as unknown as OCOpenFeed[]) ?? [],
  })) as OCWithDetails[];
}

export async function createChatSession(
  oc1Id: string,
  oc2Id: string,
  oc2UserId: string,
  oc2UserName: string | null,
  oc2Name: string | null
): Promise<ChatSession> {
  const supabase = getClient();
  const [firstId, secondId] = oc1Id < oc2Id ? [oc1Id, oc2Id] : [oc2Id, oc1Id];
  const { data, error } = await supabase
    .from("chat_sessions")
    .upsert(
      {
        oc1_id: firstId,
        oc2_id: secondId,
        oc2_user_id: oc2UserId,
        oc2_user_name: oc2UserName,
        oc2_name: oc2Name,
      },
      { onConflict: "oc1_id,oc2_id" }
    )
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function getChatSessions(userId: string): Promise<ChatSessionWithOCs[]> {
  const supabase = getClient();
  const { data: ocs } = await supabase.from("ocs").select("id").eq("user_id", userId);
  const myOcIds = ocs?.map((o) => o.id) ?? [];
  if (myOcIds.length === 0) return [];

  const { data, error } = await supabase
    .from("chat_sessions")
    .select(
      "*, oc1:ocs!oc1_id(*), oc2:ocs!oc2_id(*)"
    )
    .or(`oc1_id.in.(${myOcIds.join(",")}),oc2_user_id.eq.${userId}`);
  if (error) throw error;

  return (data ?? []).map((session) => ({
    ...session,
    oc1: (session.oc1 as unknown as OC) ?? null,
    oc2: (session.oc2 as unknown as OC) ?? null,
  })) as ChatSessionWithOCs[];
}

export async function getDashboardChats(userId: string): Promise<DashboardChat[]> {
  const supabase = getClient();
  const { data: ocs } = await supabase.from("ocs").select("id").eq("user_id", userId);
  const myOcIds = ocs?.map((o) => o.id) ?? [];
  if (myOcIds.length === 0) return [];

  const { data: sessions, error } = await supabase
    .from("chat_sessions")
    .select(
      "id, chat_level, created_at, oc1_id, oc2_id, oc2_name, oc1:ocs!oc1_id(id, name, image_url, user_id), oc2:ocs!oc2_id(id, name, image_url, user_id)"
    )
    .or(`oc1_id.in.(${myOcIds.join(",")}),oc2_user_id.eq.${userId}`)
    .order("created_at", { ascending: false });
  if (error) throw error;

  const sessionIds = (sessions ?? []).map((s) => s.id);
  const lastMessages: Record<string, { text: string; created_at: string }> = {};

  if (sessionIds.length > 0) {
    const { data: messages } = await supabase
      .from("chat_messages")
      .select("chat_id, text, created_at")
      .in("chat_id", sessionIds)
      .order("created_at", { ascending: false });

    const seen = new Set<string>();
    (messages ?? []).forEach((m) => {
      if (!seen.has(m.chat_id)) {
        seen.add(m.chat_id);
        lastMessages[m.chat_id] = { text: m.text, created_at: m.created_at ?? "" };
      }
    });
  }

  return (sessions ?? []).map((session) => {
    const oc1 = (session.oc1 as unknown as { id: string; name: string; image_url: string | null; user_id: string } | null) ?? null;
    const oc2 = (session.oc2 as unknown as { id: string; name: string; image_url: string | null; user_id: string } | null) ?? null;
    const myOc = myOcIds.includes(session.oc1_id) ? oc1 : oc2;
    const partnerOc = myOcIds.includes(session.oc1_id) ? oc2 : oc1;
    const last = lastMessages[session.id];
    return {
      id: session.id,
      chat_level: session.chat_level ?? 1,
      my_oc: myOc,
      partner_oc: partnerOc,
      last_message: last?.text ?? null,
      last_active_at: last?.created_at ?? session.created_at,
      is_online: false,
    };
  });
}

export async function getChatMessages(chatId: string): Promise<ChatMessage[]> {
  const supabase = getClient();
  const { data, error } = await supabase
    .from("chat_messages")
    .select("*")
    .eq("chat_id", chatId)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function sendChatMessage(
  chatId: string,
  fromOcId: string,
  text: string,
  imageUrl?: string
): Promise<ChatMessage> {
  const supabase = getClient();
  const { data, error } = await supabase
    .from("chat_messages")
    .insert({
      chat_id: chatId,
      from_oc_id: fromOcId,
      text,
      image_url: imageUrl ?? null,
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteChatSession(chatId: string) {
  const supabase = getClient();
  const { error } = await supabase.from("chat_sessions").delete().eq("id", chatId);
  if (error) throw error;
}

export async function blockOC(blockerOcId: string, blockedOcId: string) {
  const supabase = getClient();
  const { error } = await supabase.from("blocked_pairs").insert({
    blocker_oc_id: blockerOcId,
    blocked_oc_id: blockedOcId,
  });
  if (error) throw error;
}

export async function unblockOC(blockerOcId: string, blockedOcId: string) {
  const supabase = getClient();
  const { error } = await supabase
    .from("blocked_pairs")
    .delete()
    .eq("blocker_oc_id", blockerOcId)
    .eq("blocked_oc_id", blockedOcId);
  if (error) throw error;
}

export async function isBlocked(oc1Id: string, oc2Id: string): Promise<boolean> {
  const supabase = getClient();
  const { data, error } = await supabase
    .from("blocked_pairs")
    .select("id")
    .or(
      `and(blocker_oc_id.eq.${oc1Id},blocked_oc_id.eq.${oc2Id}),and(blocker_oc_id.eq.${oc2Id},blocked_oc_id.eq.${oc1Id})`
    )
    .limit(1);
  if (error) throw error;
  return (data?.length ?? 0) > 0;
}

export async function toggleOCSwipable(ocId: string, isSwipable: boolean) {
  const supabase = getClient();
  const { error } = await supabase
    .from("ocs")
    .update({ is_swipable: isSwipable })
    .eq("id", ocId);
  if (error) throw error;
}

export async function toggleAllOCSwipable(userId: string, isSwipable: boolean) {
  const supabase = getClient();
  const { error } = await supabase
    .from("ocs")
    .update({ is_swipable: isSwipable })
    .eq("user_id", userId);
  if (error) throw error;
}

export async function uploadImage(file: File, prefix = "profile"): Promise<string> {
  const supabase = getClient();
  const ext = file.name.split(".").pop() ?? "png";
  const path = `${prefix}/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from("oc-images").upload(path, file);
  if (error) throw error;
  const { data } = supabase.storage.from("oc-images").getPublicUrl(path);
  return data.publicUrl;
}

export async function recordProfileView(viewerId: string, profileId: string): Promise<void> {
  const supabase = getClient();
  const { error } = await supabase
    .from("profile_views")
    .insert({ viewer_id: viewerId, profile_id: profileId });
  if (error) throw error;
}

export async function getProfileViewCount(profileId: string): Promise<number> {
  const supabase = getClient();
  const { count, error } = await supabase
    .from("profile_views")
    .select("id", { count: "exact", head: true })
    .eq("profile_id", profileId);
  if (error) throw error;
  return count ?? 0;
}

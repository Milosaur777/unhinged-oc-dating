import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase-server";
import { ChatWindow } from "./ChatWindow";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function ChatPage({ params }: PageProps) {
  const { id } = await params;

  const supabase = await createClient();
  const { data: session, error } = await supabase
    .from("chat_sessions")
    .select("*, oc1:ocs!oc1_id(*), oc2:ocs!oc2_id(*)")
    .eq("id", id)
    .single();

  if (error || !session) {
    notFound();
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const oc1 = session.oc1 as { user_id: string } | null;
  const isParticipant =
    user?.id === oc1?.user_id || user?.id === session.oc2_user_id;
  if (!isParticipant) {
    notFound();
  }

  const myOcId = user?.id === oc1?.user_id
    ? (session.oc1 as { id: string })?.id
    : (session.oc2 as { id: string })?.id;

  return (
    <ChatWindow
      sessionId={session.id}
      chatLevel={session.chat_level ?? 1}
      oc1={session.oc1}
      oc2={session.oc2}
      oc2Name={session.oc2_name}
      myOcId={myOcId}
    />
  );
}

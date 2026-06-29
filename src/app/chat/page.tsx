"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { MessageCircle, Trash2, Frown, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { DashboardHeader } from "@/components/layout/DashboardHeader";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAuth } from "@/components/auth/AuthProvider";
import { getChatSessions, deleteChatSession, ChatSessionWithOCs } from "@/lib/supabase-queries";
import { getPublicImageUrl, getInitials } from "@/lib/utils";
import { toast } from "sonner";
import Image from "next/image";

export default function ChatListPage() {
  const router = useRouter();
  const { user, isGuest, loading } = useAuth();
  const [sessions, setSessions] = useState<ChatSessionWithOCs[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<ChatSessionWithOCs | null>(null);
  const [confirmName, setConfirmName] = useState("");

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.push("/auth");
      return;
    }
    if (isGuest) return;

    async function load() {
      try {
        const data = await getChatSessions(user!.id);
        setSessions(data);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to load chats");
      } finally {
        setDataLoading(false);
      }
    }
    load();
  }, [user, isGuest, loading, router]);

  async function handleDelete() {
    if (!deleteTarget) return;
    const otherName = deleteTarget.oc2_name || deleteTarget.oc2?.name || "";
    if (confirmName !== otherName) return;
    try {
      await deleteChatSession(deleteTarget.id);
      setSessions((prev) => prev.filter((s) => s.id !== deleteTarget.id));
      toast.success("Chat deleted");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete chat");
    } finally {
      setDeleteTarget(null);
      setConfirmName("");
    }
  }

  function getMyOC(session: ChatSessionWithOCs) {
    return session.oc1;
  }

  function getTheirOC(session: ChatSessionWithOCs) {
    return session.oc2;
  }

  if (loading) {
    return (
      <>
        <DashboardHeader />
        <main className="flex flex-1 items-center justify-center pt-20 md:pt-24">Loading...</main>
      </>
    );
  }

  if (!user) return null;

  if (dataLoading && !isGuest) {
    return (
      <>
        <DashboardHeader />
        <main className="flex flex-1 items-center justify-center pt-20 md:pt-24">Loading...</main>
      </>
    );
  }

  if (isGuest) {
    return (
      <>
        <DashboardHeader />
        <main className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center gap-4 px-4 pt-20 text-center md:pt-24">
          <Frown className="size-12 text-muted-foreground" />
          <h1 className="text-2xl font-bold">Chat is for logged-in users</h1>
          <Button onClick={() => router.push("/auth/login")}>Sign In</Button>
        </main>
      </>
    );
  }

  return (
    <>
      <DashboardHeader />
      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-4 py-6 pt-20 md:pt-24">
        <h1 className="text-2xl font-bold">Chats</h1>

        {sessions.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-xl py-16 text-center">
            <MessageCircle className="size-12 text-muted-foreground" />
            <p className="text-muted-foreground">No chats yet.</p>
            <Link href="/swipe">
              <Button>Start Swiping</Button>
            </Link>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {sessions.map((session) => {
              const myOC = getMyOC(session);
              const theirOC = getTheirOC(session);
              const myImage = getPublicImageUrl(myOC?.image_url);
              const theirImage = getPublicImageUrl(theirOC?.image_url);
              return (
                <div
                  key={session.id}
                  className="group/card relative overflow-hidden rounded-xl border border-white/10 bg-white/[0.03] backdrop-blur-xl transition-all duration-300 ease-out hover:border-primary/30 hover:shadow-[0_0_16px_rgba(255,45,123,0.12)]"
                >
                  <Link href={`/chat/${session.id}`} className="block">
                    <div className="flex items-center gap-4 p-4">
                      <div className="relative flex">
                        <div className="relative z-10 size-14 overflow-hidden rounded-full border-2 border-background bg-muted">
                          {myImage ? (
                            <Image
                              src={myImage}
                              alt={myOC?.name || "My OC"}
                              fill
                              className="object-cover"
                              sizes="56px"
                            />
                          ) : (
                            <div className="flex size-full items-center justify-center text-xs font-bold">
                              {getInitials(myOC?.name || "?")}
                            </div>
                          )}
                        </div>
                        <div className="relative -ml-4 size-14 overflow-hidden rounded-full border-2 border-background bg-muted">
                          {theirImage ? (
                            <Image
                              src={theirImage}
                              alt={theirOC?.name || "Their OC"}
                              fill
                              className="object-cover"
                              sizes="56px"
                            />
                          ) : (
                            <div className="flex size-full items-center justify-center text-xs font-bold">
                              {getInitials(theirOC?.name || "?")}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-semibold">
                            {myOC?.name} <ArrowRight className="mx-1 inline size-3.5 text-muted-foreground" />{" "}
                            {theirOC?.name || session.oc2_name || "Unknown"}
                          </p>
                          <Badge variant="secondary" className="px-1.5 py-0 text-[10px]">
                            Lv. {session.chat_level ?? 1}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {session.scene_name || "Match"}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        className="shrink-0 opacity-0 group-hover/card:opacity-100"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setDeleteTarget(session);
                        }}
                        aria-label="Delete chat"
                      >
                        <Trash2 className="size-4 text-destructive" />
                      </Button>
                    </div>
                  </Link>
                </div>
              );
            })}
          </div>
        )}
      </main>

      <Dialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Chat</DialogTitle>
            <DialogDescription>
              Type <strong>{deleteTarget?.oc2_name || deleteTarget?.oc2?.name}</strong> to confirm.
            </DialogDescription>
          </DialogHeader>
          <Input
            value={confirmName}
            onChange={(e) => setConfirmName(e.target.value)}
            placeholder="Type other OC name"
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={confirmName !== (deleteTarget?.oc2_name || deleteTarget?.oc2?.name)}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

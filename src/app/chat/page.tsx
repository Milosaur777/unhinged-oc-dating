"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { MessageCircle, Trash2, Frown, Search, ArrowRight } from "lucide-react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
import { getPublicImageUrl, getInitials, cn } from "@/lib/utils";
import { toast } from "sonner";

function formatRelativeTime(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return d.toLocaleDateString();
  } catch {
    return "";
  }
}

export default function ChatListPage() {
  const router = useRouter();
  const { user, isGuest, loading } = useAuth();
  const [sessions, setSessions] = useState<ChatSessionWithOCs[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<ChatSessionWithOCs | null>(null);
  const [confirmName, setConfirmName] = useState("");
  const [query, setQuery] = useState("");

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.push("/");
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

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return sessions;
    return sessions.filter((s) => {
      const oc1Name = s.oc1?.name?.toLowerCase() ?? "";
      const oc2Name = (s.oc2?.name ?? s.oc2_name ?? "").toLowerCase();
      return oc1Name.includes(q) || oc2Name.includes(q);
    });
  }, [sessions, query]);

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
      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-4 px-4 py-6 pt-20 md:pt-24">
        <h1 className="text-2xl font-bold">Chats</h1>

        <div className="relative">
          <Search className="absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name..."
            className="border-white/10 bg-white/[0.03] pl-9 backdrop-blur-xl"
          />
        </div>

        {sessions.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-xl py-16 text-center">
            <MessageCircle className="size-12 text-muted-foreground" />
            <p className="text-muted-foreground">No chats yet.</p>
            <Link href="/swipe">
              <Button>Start Swiping</Button>
            </Link>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-xl py-16">
            <Frown className="size-10 text-muted-foreground" />
            <p className="text-muted-foreground">No matches found.</p>
            <Button variant="outline" onClick={() => setQuery("")}>
              Clear search
            </Button>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {filtered.map((session) => {
              const myOC = getMyOC(session);
              const theirOC = getTheirOC(session);
              const myImage = getPublicImageUrl(myOC?.image_url);
              const theirImage = getPublicImageUrl(theirOC?.image_url);
              const lastMessage = (session as Record<string, unknown>).last_message as string | undefined;
              const lastActive = (session as Record<string, unknown>).last_active_at as string | undefined;

              return (
                <div
                  key={session.id}
                  className="group/card relative overflow-hidden rounded-xl border border-white/10 bg-white/[0.03] backdrop-blur-xl transition-all duration-300 ease-out hover:border-primary/30 hover:shadow-[0_0_16px_rgba(255,45,123,0.12)]"
                >
                  <Link href={`/chat/${session.id}`} className="block p-4">
                    <div className="flex items-center gap-3">
                      <Link
                        href={`/oc/${theirOC?.id}?from=chat`}
                        onClick={(e) => e.stopPropagation()}
                        className="relative shrink-0 cursor-pointer"
                      >
                        <div className="relative size-16 overflow-hidden rounded-full border-2 border-background bg-muted transition-all duration-200 hover:ring-2 hover:ring-primary/50">
                          {theirImage ? (
                            <Image
                              src={theirImage}
                              alt={theirOC?.name || "Their OC"}
                              fill
                              className="object-cover"
                              sizes="64px"
                            />
                          ) : (
                            <div className="flex size-full items-center justify-center text-sm font-bold">
                              {getInitials(theirOC?.name || "?")}
                            </div>
                          )}
                        </div>
                        <span className="absolute right-0 bottom-0 size-3.5 rounded-full border-2 border-background bg-green-500" />
                      </Link>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 text-sm">
                          <span className="font-semibold text-foreground">{theirOC?.name || "?"}</span>
                          <ArrowRight className="size-3 text-muted-foreground" />
                          <span className="font-semibold text-foreground">{myOC?.name || "?"}</span>
                          <Badge variant="secondary" className="ml-1 shrink-0 border border-primary/20 bg-primary/10 px-1.5 py-0 text-[10px] text-primary">
                            Lv. {session.chat_level ?? 1}
                          </Badge>
                        </div>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {lastMessage || "No messages yet"}
                        </p>
                        {lastActive && (
                          <p className="mt-0.5 text-[10px] text-muted-foreground">
                            {formatRelativeTime(lastActive)}
                          </p>
                        )}
                      </div>

                      <Link
                        href={`/oc/${theirOC?.id}?from=chat`}
                        onClick={(e) => e.stopPropagation()}
                        className="shrink-0"
                      >
                        <div className="relative size-10 overflow-hidden rounded-full bg-muted transition-all duration-200 hover:ring-2 hover:ring-primary/50">
                          {myImage ? (
                            <Image
                              src={myImage}
                              alt={myOC?.name || "My OC"}
                              fill
                              className="object-cover"
                              sizes="40px"
                            />
                          ) : (
                            <div className="flex size-full items-center justify-center text-[10px] font-bold">
                              {getInitials(myOC?.name || "?")}
                            </div>
                          )}
                        </div>
                      </Link>

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

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Heart, X, Frown, Flame } from "lucide-react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { DashboardHeader } from "@/components/layout/DashboardHeader";
import { useAuth } from "@/components/auth/AuthProvider";
import {
  getIncomingLikes,
  recordSwipe,
  createChatSession,
  getUserOCs,
  IncomingLike,
} from "@/lib/supabase-queries";
import { getPublicImageUrl, getInitials } from "@/lib/utils";
import { toast } from "sonner";
import MatchModal from "@/components/match/MatchModal";

export default function LikesPage() {
  const router = useRouter();
  const { user, isGuest, loading } = useAuth();
  const [likes, setLikes] = useState<IncomingLike[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [matchModalOpen, setMatchModalOpen] = useState(false);
  const [matchedOc, setMatchedOc] = useState<{ name: string; image_url: string | null; id: string } | null>(null);
  const [myOcForMatch, setMyOcForMatch] = useState<{ name: string; image_url: string | null } | null>(null);
  const [matchedChatId, setMatchedChatId] = useState<string | null>(null);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.push("/");
      return;
    }
    if (isGuest) return;

    async function load() {
      try {
        const ocs = await getUserOCs(user!.id);
        const ids = ocs.map((o) => o.id);
        if (ids.length === 0) {
          setDataLoading(false);
          return;
        }
        const data = await getIncomingLikes(ids);
        setLikes(data);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to load likes");
      } finally {
        setDataLoading(false);
      }
    }
    load();
  }, [user, isGuest, loading, router]);

  async function handleLikeBack(like: IncomingLike) {
    try {
      await recordSwipe(like.to_oc_id, like.from_oc_id, "like");

      // We already know they liked us (this is an incoming like),
      // so create the chat session directly without checking.
      const myUserId = like.target_oc?.user_id || user?.id || "";
      const theirUserId = like.liker_oc?.user_id || await (await import("@/lib/supabase-queries")).getOCUserId(like.from_oc_id) || "";
      if (!theirUserId) {
        console.error("Cannot create chat session: missing user_id for OC", like.from_oc_id);
        toast.error("Failed to match: missing creator info");
        return;
      }

      const session = await createChatSession(
        like.to_oc_id,
        like.from_oc_id,
        myUserId,
        theirUserId,
        null,
        null,
        like.target_oc?.name || null,
        like.liker_oc?.name || null
      );

      setMatchedOc({
        name: like.liker_oc?.name || "Unknown",
        image_url: like.liker_oc?.image_url || null,
        id: like.from_oc_id,
      });
      setMyOcForMatch({
        name: like.target_oc?.name || "Unknown",
        image_url: like.target_oc?.image_url || null,
      });
      setMatchedChatId(session.id);
      setMatchModalOpen(true);
      setLikes((prev) => prev.filter((l) => l.id !== like.id));
      toast.success(`Matched with ${like.liker_oc?.name || "Unknown"}!`);
    } catch (err) {
      console.error("handleLikeBack error:", err);
      toast.error(err instanceof Error ? err.message : "Failed to match");
    }
  }

  async function handlePass(like: IncomingLike) {
    try {
      await recordSwipe(like.to_oc_id, like.from_oc_id, "pass");
      setLikes((prev) => prev.filter((l) => l.id !== like.id));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to pass");
    }
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
          <h1 className="text-2xl font-bold">Likes are for logged-in users</h1>
          <Button onClick={() => router.push("/auth/login")}>Sign In</Button>
        </main>
      </>
    );
  }

  return (
    <>
      <DashboardHeader />
      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-4 py-6 pt-20 md:pt-24">
        <h1 className="text-2xl font-bold">Incoming Likes</h1>

        {likes.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-xl py-16 text-center">
            <Heart className="size-12 text-muted-foreground" />
            <p className="text-muted-foreground">No one has liked your OCs yet.</p>
            <Link href="/swipe">
              <Button className="gap-2">
                <Flame className="size-4" />
                Start Swiping
              </Button>
            </Link>
          </div>
        ) : (
          <>
            <div className="flex flex-col gap-3">
              {likes.map((like) => {
                const imageUrl = getPublicImageUrl(like.liker_oc?.image_url);
                return (
                  <div
                    key={like.id}
                    className="flex flex-col gap-3 rounded-xl border border-white/10 bg-white/[0.03] backdrop-blur-xl p-4 sm:flex-row sm:items-center transition-all duration-300 ease-out hover:border-primary/30 hover:shadow-[0_0_16px_rgba(255,45,123,0.12)]"
                  >
                    <div className="flex items-center gap-3">
                      <Link
                        href={`/oc/${like.from_oc_id}?from=likes`}
                        className="shrink-0"
                      >
                        <div className="relative size-16 overflow-hidden rounded-full bg-muted transition-all duration-200 hover:ring-2 hover:ring-primary/50 cursor-pointer">
                          {imageUrl ? (
                            <Image
                              src={imageUrl}
                              alt={like.liker_oc?.name || ""}
                              fill
                              className="object-cover"
                              sizes="64px"
                            />
                          ) : (
                            <div className="flex size-full items-center justify-center text-sm font-bold">
                              {getInitials(like.liker_oc?.name || "?")}
                            </div>
                          )}
                        </div>
                      </Link>
                      <div>
                        <p className="font-medium">
                          <span className="text-primary">{like.liker_oc?.name}</span> liked{" "}
                          <span className="text-foreground">{like.target_oc?.name}</span>
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(like.created_at || "1970-01-01T00:00:00Z").toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2 sm:ml-auto">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePass(like)}
                        className="gap-1"
                      >
                        <X className="size-3.5" />
                        Pass
                      </Button>
                      <Button size="sm" onClick={() => handleLikeBack(like)} className="gap-1">
                        <Heart className="size-3.5" />
                        Like Back
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
            <Link href="/swipe" className="mx-auto">
              <Button variant="outline" className="gap-2">
                <Flame className="size-4" />
                Start Swiping
              </Button>
            </Link>
          </>
        )}
      </main>
      <MatchModal
        open={matchModalOpen}
        myOc={myOcForMatch}
        matchedOc={matchedOc}
        onStartChat={() => {
          setMatchModalOpen(false);
          if (matchedChatId) router.push(`/chat/${matchedChatId}`);
        }}
        onClose={() => setMatchModalOpen(false)}
      />
    </>
  );
}

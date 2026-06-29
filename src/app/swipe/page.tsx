"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, useMotionValue, useTransform, PanInfo } from "framer-motion";
import { X, Heart, Flame, Info, Search, Frown, RotateCcw } from "lucide-react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DashboardHeader } from "@/components/layout/DashboardHeader";
import { TagPillList } from "@/components/ui/TagPill";
import { OCCard } from "@/components/oc/OCCard";
import { useAuth } from "@/components/auth/AuthProvider";
import {
  getSwipeCandidates,
  recordSwipe,
  checkMutualLike,
  createChatSession,
  OCWithDetails,
  getUserOCs,
  resetSwipes,
  getPublicOCs,
} from "@/lib/supabase-queries";
import { getPublicImageUrl, getInitials, cn } from "@/lib/utils";
import { toast } from "sonner";

const SWIPE_THRESHOLD = 100;
const ROTATION_LIMIT = 20;

function getField(oc: OCWithDetails, key: string): string | null {
  return oc.fields.find((f) => f.field_key === key && f.visible !== false)?.value ?? null;
}

export default function SwipePage() {
  const router = useRouter();
  const { user, isGuest, loading } = useAuth();
  const [candidates, setCandidates] = useState<OCWithDetails[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [dataLoading, setDataLoading] = useState(true);
  const [myOcIds, setMyOcIds] = useState<string[]>([]);
  const [resetting, setResetting] = useState(false);
  const suppressTapRef = useRef(false);

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
        setMyOcIds(ids);
        if (ids.length === 0) {
          setDataLoading(false);
          return;
        }
        const candidates = await getSwipeCandidates(ids, user!.id);
        setCandidates(candidates);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to load cards");
      } finally {
        setDataLoading(false);
      }
    }
    load();
  }, [user, isGuest, loading, router]);

  const current = candidates[currentIndex];

  async function refreshCandidates() {
    if (myOcIds.length === 0 || !user) return;
    const fresh = await getSwipeCandidates(myOcIds, user.id);
    setCandidates(fresh);
    setCurrentIndex(0);
  }

  async function handleResetSwipes() {
    if (!user || resetting) return;
    setResetting(true);
    try {
      await resetSwipes(user.id);
      await refreshCandidates();
      toast.success("Swipes reset");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to reset swipes");
    } finally {
      setResetting(false);
    }
  }

  function handleResult(action: "like" | "pass") {
    if (!current || myOcIds.length === 0) return;

    const myOcId = myOcIds[0];
    recordSwipe(myOcId, current.id, action).then(async () => {
      if (action === "like") {
        const mutual = await checkMutualLike(myOcId, current.id);
        if (mutual) {
          await createChatSession(
            myOcId,
            current.id,
            current.user_id,
            null,
            current.name
          );
          toast.success(`It's a match with ${current.name}!`);
        }
      }
      setCurrentIndex((i) => i + 1);
    });
  }

  function scrollToMatches() {
    document.getElementById("matches")?.scrollIntoView({ behavior: "smooth" });
  }

  if (loading) {
    return (
      <>
        <DashboardHeader />
        <main className="flex flex-1 items-center justify-center">Loading...</main>
      </>
    );
  }

  if (!user) return null;

  if (dataLoading && !isGuest) {
    return (
      <>
        <DashboardHeader />
        <main className="flex flex-1 items-center justify-center">Loading...</main>
      </>
    );
  }

  if (isGuest) {
    return (
      <>
        <DashboardHeader />
        <main className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center gap-4 px-4 text-center">
          <Flame className="size-12 text-muted-foreground" />
          <h1 className="text-2xl font-bold">Swiping is for logged-in users</h1>
          <p className="text-muted-foreground">
            Guest mode lets you build OCs locally. Sign in to swipe and chat with real characters.
          </p>
          <Button onClick={() => router.push("/auth/login")}>Sign In</Button>
        </main>
      </>
    );
  }

  return (
    <>
      <DashboardHeader />
      <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col px-4 py-6">
        <div className="mx-auto w-full max-w-md">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold">Swipe</h1>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleResetSwipes}
                disabled={resetting}
                className="gap-1.5"
              >
                <RotateCcw className="size-3.5" />
                Reset
              </Button>
              <p className="text-sm text-muted-foreground">
                {currentIndex + 1} / {candidates.length}
              </p>
            </div>
          </div>

          {candidates.length === 0 || currentIndex >= candidates.length ? (
            <div className="flex flex-col items-center justify-center gap-4 py-12 text-center">
              <Flame className="size-12 text-muted-foreground" />
              <h2 className="text-xl font-semibold">No more cards</h2>
              <p className="text-sm text-muted-foreground">
                Check back later or browse all matches.
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleResetSwipes}
                  disabled={resetting}
                  className="gap-1.5"
                >
                  <RotateCcw className="size-3.5" />
                  Reset Swipes
                </Button>
                <Button variant="outline" onClick={scrollToMatches}>
                  Browse Matches
                </Button>
              </div>
            </div>
          ) : (
            <>
              <div className="relative mt-6 flex h-[60vh] flex-col">
                <SwipeCard
                  key={current.id}
                  oc={current}
                  onResult={handleResult}
                  suppressTapRef={suppressTapRef}
                />
              </div>
              <div className="mt-6 flex items-center justify-center gap-4 pb-6">
                <Button
                  variant="outline"
                  size="icon-lg"
                  onClick={() => handleResult("pass")}
                  className="rounded-full border-destructive text-destructive hover:bg-destructive/10"
                  aria-label="Pass"
                >
                  <X className="size-6" />
                </Button>
                <Button
                  size="icon-lg"
                  onClick={() => handleResult("like")}
                  className="rounded-full shadow-[0_0_20px_rgba(255,45,123,0.4)]"
                  aria-label="Like"
                >
                  <Heart className="size-6" />
                </Button>
              </div>
              <div className="flex justify-center pb-6">
                <Button variant="ghost" size="sm" onClick={scrollToMatches}>
                  Browse matches below
                </Button>
              </div>
            </>
          )}
        </div>

        <section id="matches" className="mt-6 border-t border-border pt-8">
          <MatchesSection userId={user.id} />
        </section>
      </main>
    </>
  );
}

function MatchesSection({ userId }: { userId: string }) {
  const [ocs, setOcs] = useState<OCWithDetails[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [query, setQuery] = useState("");

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const data = await getPublicOCs(userId);
        if (!cancelled) setOcs(data);
      } catch (err) {
        if (!cancelled) {
          toast.error(err instanceof Error ? err.message : "Failed to load matches");
        }
      } finally {
        if (!cancelled) setDataLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [userId]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return ocs;
    return ocs.filter((oc) => {
      const matchesName = oc.name.toLowerCase().includes(q);
      const matchesId = oc.id.toLowerCase().includes(q);
      const matchesTag = oc.tags?.some((t) => t.toLowerCase().includes(q));
      return matchesName || matchesId || matchesTag;
    });
  }, [ocs, query]);

  return (
    <div className="flex flex-col gap-6 px-2 md:px-4">
      <div className="flex flex-col gap-4">
        <h2 className="text-2xl font-bold">Your Matches</h2>
        <div className="relative max-w-md">
          <Search className="absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by Name / ID / Tag..."
            className="pl-9"
          />
        </div>
      </div>

      {dataLoading ? (
        <div className="text-sm text-muted-foreground">Loading matches...</div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border bg-card/50 py-16">
          <Frown className="size-10 text-muted-foreground" />
          <p className="text-muted-foreground">No matches found.</p>
          {query ? (
            <Button variant="outline" onClick={() => setQuery("")}>
              Clear filters
            </Button>
          ) : null}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {filtered.map((oc) => (
            <Link key={oc.id} href={`/oc/${oc.id}`}>
              <OCCard oc={oc} showActions={false} />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

interface SwipeCardProps {
  oc: OCWithDetails;
  onResult: (action: "like" | "pass") => void;
  suppressTapRef: React.MutableRefObject<boolean>;
}

function SwipeCard({ oc, onResult, suppressTapRef }: SwipeCardProps) {
  const router = useRouter();
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-300, 300], [-ROTATION_LIMIT, ROTATION_LIMIT]);
  const likeOpacity = useTransform(x, [50, 150], [0, 1]);
  const nopeOpacity = useTransform(x, [-150, -50], [1, 0]);
  const imageUrl = getPublicImageUrl(oc.image_url);

  function handleDragEnd(_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) {
    if (Math.abs(info.offset.x) > SWIPE_THRESHOLD || Math.abs(info.velocity.x) > 500) {
      suppressTapRef.current = true;
      const action = info.offset.x > 0 ? "like" : "pass";
      onResult(action);
    } else {
      setTimeout(() => {
        suppressTapRef.current = false;
      }, 100);
    }
  }

  function handleDrag() {
    suppressTapRef.current = true;
  }

  function handleClick() {
    if (suppressTapRef.current) {
      suppressTapRef.current = false;
      return;
    }
    router.push(`/oc/${oc.id}?card=swipe&oc=${oc.id}`);
  }

  return (
    <motion.div
      style={{ x, rotate, touchAction: "none" }}
      drag
      dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
      dragElastic={0.8}
      onDrag={handleDrag}
      onDragEnd={handleDragEnd}
      onClick={handleClick}
      whileTap={{ cursor: "grabbing" }}
      className="relative flex-1 cursor-grab touch-none overflow-hidden rounded-2xl bg-card ring-1 ring-foreground/10"
    >
      <div className="relative aspect-[3/4] w-full">
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={oc.name}
            fill
            className="object-cover"
            sizes="100vw"
            draggable={false}
            priority
          />
        ) : (
          <div className="flex size-full items-center justify-center bg-muted text-5xl font-bold text-muted-foreground">
            {getInitials(oc.name)}
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />

        <motion.div
          style={{ opacity: likeOpacity }}
          className="absolute top-8 left-8 -rotate-12 rounded-lg border-4 border-green-500 px-4 py-2 text-3xl font-bold text-green-500"
        >
          LIKE
        </motion.div>
        <motion.div
          style={{ opacity: nopeOpacity }}
          className="absolute top-8 right-8 rotate-12 rounded-lg border-4 border-destructive px-4 py-2 text-3xl font-bold text-destructive"
        >
          NOPE
        </motion.div>

        <div className="absolute bottom-0 left-0 right-0 p-5">
          <div className="flex items-center gap-2">
            <h2 className="text-3xl font-bold text-white">{oc.name}</h2>
            <Info className="size-5 text-white/70" />
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-white/80">
            {getField(oc, "species") && <span>{getField(oc, "species")}</span>}
            {getField(oc, "gender") && (
              <>
                <span className="text-white/50">•</span>
                <span>{getField(oc, "gender")}</span>
              </>
            )}
            {getField(oc, "age") && (
              <>
                <span className="text-white/50">•</span>
                <span>{getField(oc, "age")}</span>
              </>
            )}
          </div>
          <div className="mt-3">
            <TagPillList tags={oc.tags} max={5} />
          </div>
        </div>
      </div>
    </motion.div>
  );
}

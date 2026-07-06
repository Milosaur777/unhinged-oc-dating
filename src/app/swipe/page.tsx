"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, useMotionValue, useTransform, PanInfo, animate } from "framer-motion";
import { X, Heart, Flame, Info, RotateCcw, User } from "lucide-react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { DashboardHeader } from "@/components/layout/DashboardHeader";
import { TagPillList } from "@/components/ui/TagPill";
import { useAuth } from "@/components/auth/AuthProvider";
import {
  getSwipeCandidates,
  recordSwipe,
  checkMutualLike,
  createChatSession,
  OCWithDetails,
  getUserOCs,
  resetSwipes,
  OC,
} from "@/lib/supabase-queries";
import { getPublicImageUrl, getInitials, cn } from "@/lib/utils";
import { toast } from "sonner";
import MatchModal from "@/components/match/MatchModal";

const SWIPE_KEY = "unhinged_swipe_state";

interface SwipeState {
  ocId: string;
  index: number;
  targetOcId?: string;
}

function getSwipeThreshold() {
  if (typeof window === "undefined") return 100;
  return window.innerWidth >= 768 ? 120 : 140;
}

function getVelocityThreshold() {
  if (typeof window === "undefined") return 500;
  return window.innerWidth >= 768 ? 500 : 600;
}

function getField(oc: OCWithDetails, key: string): string | null {
  return oc.fields.find((f) => f.field_key === key && f.visible !== false)?.value ?? null;
}

export default function SwipePage() {
  const router = useRouter();
  const { user, isGuest, loading } = useAuth();
  const [myOCs, setMyOCs] = useState<OC[]>([]);
  const [selectedOcId, setSelectedOcId] = useState<string | null>(null);
  const [candidates, setCandidates] = useState<OCWithDetails[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [dataLoading, setDataLoading] = useState(true);
  const [resetting, setResetting] = useState(false);
  const [matchModalOpen, setMatchModalOpen] = useState(false);
  const [matchedOc, setMatchedOc] = useState<{ name: string; image_url: string | null; id: string } | null>(null);
  const [myOcForMatch, setMyOcForMatch] = useState<{ name: string; image_url: string | null } | null>(null);
  const [matchedChatId, setMatchedChatId] = useState<string | null>(null);
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
        setMyOCs(ocs);
        const saved = sessionStorage.getItem(SWIPE_KEY);
        if (saved) {
          try {
            const state: SwipeState = JSON.parse(saved);
            if (ocs.some((o) => o.id === state.ocId)) {
              setSelectedOcId(state.ocId);
            } else if (ocs.length === 1) {
              setSelectedOcId(ocs[0].id);
            }
          } catch {
            if (ocs.length === 1) setSelectedOcId(ocs[0].id);
          }
        } else if (ocs.length === 1) {
          setSelectedOcId(ocs[0].id);
        }
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to load your OCs");
      } finally {
        setDataLoading(false);
      }
    }
    load();
  }, [user, isGuest, loading, router]);

  useEffect(() => {
    if (!selectedOcId || !user) return;
    let cancelled = false;

    const saved = sessionStorage.getItem(SWIPE_KEY);
    if (saved && candidates.length > 0) {
      try {
        const state: SwipeState = JSON.parse(saved);
        if (state.ocId === selectedOcId) {
          if (state.targetOcId) {
            const idx = candidates.findIndex((c) => c.id === state.targetOcId);
            if (idx !== -1) setCurrentIndex(idx);
          } else if (state.index < candidates.length) {
            setCurrentIndex(state.index);
          }
        }
      } catch {}
      sessionStorage.removeItem(SWIPE_KEY);
      return;
    }

    async function load() {
      try {
        const fresh = await getSwipeCandidates([selectedOcId!], user!.id);
        if (!cancelled) {
          setCandidates(fresh);
          const savedSession = sessionStorage.getItem(SWIPE_KEY);
          if (savedSession) {
            try {
              const state: SwipeState = JSON.parse(savedSession);
              if (state.ocId === selectedOcId) {
                if (state.targetOcId) {
                  const idx = fresh.findIndex((c) => c.id === state.targetOcId);
                  if (idx !== -1) setCurrentIndex(idx);
                } else if (state.index < fresh.length) {
                  setCurrentIndex(state.index);
                }
              }
            } catch {}
            sessionStorage.removeItem(SWIPE_KEY);
          } else {
            setCurrentIndex(0);
          }
        }
      } catch (err) {
        if (!cancelled) toast.error(err instanceof Error ? err.message : "Failed to load candidates");
      }
    }
    load();
    return () => { cancelled = true; };
  }, [selectedOcId, user]);

  const current = candidates[currentIndex];

  async function handleResetSwipes() {
    if (!user || resetting || !selectedOcId) return;
    setResetting(true);
    try {
      await resetSwipes(user.id);
      const fresh = await getSwipeCandidates([selectedOcId], user.id);
      setCandidates(fresh);
      setCurrentIndex(0);
      toast.success("Swipes reset");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to reset swipes");
    } finally {
      setResetting(false);
    }
  }

  function handleResult(action: "like" | "pass") {
    if (!current || !selectedOcId) return;

    const myOc = myOCs.find((o) => o.id === selectedOcId);

    recordSwipe(selectedOcId, current.id, action)
      .then(async () => {
        if (action === "like") {
          try {
            const mutual = await checkMutualLike(selectedOcId, current.id);
            if (mutual) {
              const session = await createChatSession(
                selectedOcId,
                current.id,
                user!.id,
                current.user_id,
                null,
                null,
                myOc?.name || null,
                current.name
              );
              setMatchedOc({ name: current.name, image_url: current.image_url, id: current.id });
              setMyOcForMatch(myOc ? { name: myOc.name, image_url: myOc.image_url } : null);
              setMatchedChatId(session.id);
              setMatchModalOpen(true);
              toast.success(`Matched with ${current.name}!`);
            }
          } catch (err) {
            console.error("Match creation failed:", err);
            toast.error(err instanceof Error ? err.message : "Failed to create match");
          }
        }
        setCurrentIndex((i) => i + 1);
      })
      .catch((err) => {
        console.error("recordSwipe failed:", err);
        toast.error(err instanceof Error ? err.message : "Failed to record swipe");
        setCurrentIndex((i) => i + 1);
      });
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

  if (myOCs.length === 0) {
    return (
      <>
        <DashboardHeader />
        <main className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center gap-4 px-4 pt-20 text-center md:pt-24">
          <User className="size-12 text-muted-foreground" />
          <h1 className="text-2xl font-bold">Create an OC first</h1>
          <p className="text-muted-foreground">
            You need at least one character to start swiping.
          </p>
          <Link href="/create">
            <Button>Create Character</Button>
          </Link>
        </main>
      </>
    );
  }

  if (!selectedOcId) {
    return (
      <>
        <DashboardHeader />
        <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-4 py-6 pt-20 md:pt-24">
          <div className="text-center">
            <h1 className="text-2xl font-bold">Choose your character</h1>
            <p className="text-sm text-muted-foreground">Pick who you want to swipe as</p>
          </div>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            {myOCs.map((oc) => {
              const imageUrl = getPublicImageUrl(oc.image_url);
              return (
                <button
                  key={oc.id}
                  onClick={() => setSelectedOcId(oc.id)}
                  className="group relative overflow-hidden rounded-xl border border-white/10 bg-white/[0.03] transition-all duration-200 hover:border-primary/50 hover:shadow-[0_0_24px_rgba(255,45,123,0.2)] cursor-pointer"
                >
                  <div className="relative aspect-[3/4] w-full">
                    {imageUrl ? (
                      <Image
                        src={imageUrl}
                        alt={oc.name}
                        fill
                        className="object-cover transition-transform duration-300 group-hover:scale-105"
                        sizes="(max-width: 640px) 50vw, 33vw"
                      />
                    ) : (
                      <div className="flex size-full items-center justify-center bg-zinc-900 text-3xl font-bold text-muted-foreground">
                        {getInitials(oc.name)}
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 p-3">
                      <h3 className="text-sm font-bold text-white">{oc.name}</h3>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <DashboardHeader />
      <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col px-4 py-6 pt-20 md:pt-24">
        <div className="mx-auto w-full max-w-md">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold">Swipe</h1>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedOcId(null)}
                className="gap-1.5"
              >
                Switch OC
              </Button>
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
            <div className="flex flex-col items-center justify-center gap-4 rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-xl py-12 mt-8 text-center">
              <Flame className="size-12 text-muted-foreground" />
              <h2 className="text-xl font-semibold">No more cards</h2>
              <p className="text-sm text-muted-foreground">
                Check back later for new characters.
              </p>
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
            </div>
          ) : (
            <>
              <div className="relative mt-6 flex h-[60vh] flex-col">
                <SwipeCard
                  key={current.id}
                  oc={current}
                  onResult={handleResult}
                  suppressTapRef={suppressTapRef}
                  selectedOcId={selectedOcId}
                  currentIndex={currentIndex}
                />
              </div>
              <div className="mt-6 flex items-center justify-center gap-4 pb-6">
                <Button
                  variant="outline"
                  size="icon-lg"
                  onClick={() => handleResult("pass")}
                  className="rounded-full border-destructive/50 text-destructive hover:bg-destructive/10 hover:shadow-[0_0_20px_rgba(255,68,68,0.3)]"
                  aria-label="Pass"
                >
                  <X className="size-6" />
                </Button>
                <Button
                  size="icon-lg"
                  onClick={() => handleResult("like")}
                  className="rounded-full shadow-[0_0_24px_rgba(255,45,123,0.45)] hover:shadow-[0_0_32px_rgba(255,45,123,0.6)]"
                  aria-label="Like"
                >
                  <Heart className="size-6" />
                </Button>
              </div>
            </>
          )}
        </div>
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

interface SwipeCardProps {
  oc: OCWithDetails;
  onResult: (action: "like" | "pass") => void;
  suppressTapRef: React.MutableRefObject<boolean>;
  selectedOcId: string | null;
  currentIndex: number;
}

function SwipeCard({ oc, onResult, suppressTapRef, selectedOcId, currentIndex }: SwipeCardProps) {
  const router = useRouter();
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-400, 400], [-25, 25]);
  const likeOpacity = useTransform(x, [50, 150], [0, 1]);
  const nopeOpacity = useTransform(x, [-150, -50], [1, 0]);
  const cardRef = useRef<HTMLDivElement>(null);
  const imageUrl = getPublicImageUrl(oc.image_url);
  const dragOccurred = useRef(false);

  function handleDragEnd(_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) {
    if (!dragOccurred.current) {
      animate(x, 0, { type: "spring", stiffness: 500, damping: 30 });
      return;
    }

    const threshold = getSwipeThreshold();
    const velocityThreshold = getVelocityThreshold();
    const offset = Math.abs(info.offset.x);
    const velocity = Math.abs(info.velocity.x);

    // Fast flick: normal threshold
    // Slow drag: need to go 2x as far to commit
    const isFlick = velocity > velocityThreshold;
    const isDeepDrag = offset > threshold * 1.8;
    const isModerateDragWithSpeed = offset > threshold && velocity > velocityThreshold * 0.25;

    const shouldFlyOut = isFlick || isDeepDrag || isModerateDragWithSpeed;

    if (shouldFlyOut) {
      suppressTapRef.current = true;
      const direction = info.offset.x > 0 ? 1 : -1;
      const flyX = direction * window.innerWidth * 1.5;
      const flyRotate = direction * 45;

      animate(x, flyX, {
        type: "tween",
        duration: 0.4,
        ease: [0.32, 0.72, 0, 1],
      }).then(() => {
        const action = direction > 0 ? "like" : "pass";
        onResult(action);
      });

      if (cardRef.current) {
        animate(cardRef.current, { rotate: flyRotate }, { type: "tween", duration: 0.4, ease: [0.32, 0.72, 0, 1] });
      }
    } else {
      animate(x, 0, { type: "spring", stiffness: 500, damping: 30 });
      setTimeout(() => {
        suppressTapRef.current = false;
        dragOccurred.current = false;
      }, 100);
    }
  }

  function handleDrag() {
    dragOccurred.current = true;
    suppressTapRef.current = true;
  }

  function handleClick() {
    if (suppressTapRef.current) {
      suppressTapRef.current = false;
      dragOccurred.current = false;
      return;
    }
    if (selectedOcId) {
      sessionStorage.setItem(SWIPE_KEY, JSON.stringify({ ocId: selectedOcId, index: currentIndex, targetOcId: oc.id }));
    }
    router.push(`/oc/${oc.id}?card=swipe&oc=${oc.id}`);
  }

  return (
    <motion.div
      ref={cardRef}
      style={{ x, rotate, touchAction: "none" }}
      drag="x"
      dragDirectionLock
      dragElastic={0.7}
      dragMomentum={false}
      onDrag={handleDrag}
      onDragEnd={handleDragEnd}
      onClick={handleClick}
      whileTap={{ cursor: "grabbing" }}
      className="relative flex-1 cursor-grab touch-none overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-b from-zinc-950/60 to-zinc-950/30 ring-1 ring-white/5 backdrop-blur-sm shadow-[0_8px_40px_rgba(0,0,0,0.4)]"
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
          <div className="flex size-full items-center justify-center bg-zinc-900 text-5xl font-bold text-muted-foreground">
            {getInitials(oc.name)}
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />

        <motion.div
          style={{ opacity: likeOpacity }}
          className="absolute top-8 left-8 -rotate-12 rounded-xl border-4 border-green-500 bg-green-500/10 px-4 py-2 text-3xl font-bold text-green-500 shadow-[0_0_24px_rgba(34,197,94,0.4)] backdrop-blur-sm"
        >
          LIKE
        </motion.div>
        <motion.div
          style={{ opacity: nopeOpacity }}
          className="absolute top-8 right-8 rotate-12 rounded-xl border-4 border-destructive bg-destructive/10 px-4 py-2 text-3xl font-bold text-destructive shadow-[0_0_24px_rgba(255,68,68,0.4)] backdrop-blur-sm"
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
                <span className="text-white/40">&bull;</span>
                <span>{getField(oc, "gender")}</span>
              </>
            )}
            {getField(oc, "age") && (
              <>
                <span className="text-white/40">&bull;</span>
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

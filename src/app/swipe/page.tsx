"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, useMotionValue, useTransform, PanInfo } from "framer-motion";
import { X, Heart, Flame, Info } from "lucide-react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { DashboardHeader } from "@/components/layout/DashboardHeader";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/components/auth/AuthProvider";
import {
  getSwipeCandidates,
  recordSwipe,
  checkMutualLike,
  createChatSession,
  OCWithDetails,
  getUserOCs,
} from "@/lib/supabase-queries";
import { getPublicImageUrl, getInitials } from "@/lib/utils";
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
  const suppressTapRef = useRef(false);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.push("/auth");
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
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col px-4 py-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Swipe</h1>
          <p className="text-sm text-muted-foreground">
            {currentIndex + 1} / {candidates.length}
          </p>
        </div>

        {candidates.length === 0 || currentIndex >= candidates.length ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center">
            <Flame className="size-12 text-muted-foreground" />
            <h2 className="text-xl font-semibold">No more cards</h2>
            <p className="text-sm text-muted-foreground">
              Check back later or browse all matches.
            </p>
            <Link href="/matches">
              <Button variant="outline">Browse Matches</Button>
            </Link>
          </div>
        ) : (
          <>
            <div className="relative mt-6 flex flex-1 flex-col">
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
                className="rounded-full"
                aria-label="Like"
              >
                <Heart className="size-6" />
              </Button>
            </div>
          </>
        )}
      </main>
    </>
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
      style={{ x, rotate }}
      drag
      dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
      dragElastic={0.8}
      onDrag={handleDrag}
      onDragEnd={handleDragEnd}
      onClick={handleClick}
      whileTap={{ cursor: "grabbing" }}
      className="relative flex-1 cursor-grab overflow-hidden rounded-2xl bg-card ring-1 ring-foreground/10"
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
          className="absolute top-8 right-8 rotate-12 rounded-lg border-4 border-green-500 px-4 py-2 text-3xl font-bold text-green-500"
        >
          LIKE
        </motion.div>
        <motion.div
          style={{ opacity: nopeOpacity }}
          className="absolute top-8 left-8 -rotate-12 rounded-lg border-4 border-destructive px-4 py-2 text-3xl font-bold text-destructive"
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
          <div className="mt-3 flex flex-wrap gap-1.5">
            {oc.tags?.slice(0, 5).map((tag) => (
              <Badge key={tag} variant="secondary" className="bg-black/40 text-white">
                {tag}
              </Badge>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

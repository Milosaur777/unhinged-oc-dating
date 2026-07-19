"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Copy, Pencil, ArrowLeft, CheckCircle, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DashboardHeader } from "@/components/layout/DashboardHeader";
import { TagPillList } from "@/components/ui/TagPill";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { OCWithDetails, OCField, Profile, recordProfileView } from "@/lib/supabase-queries";
import { getPublicImageUrl, getInitials } from "@/lib/utils";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase";

interface ShuffledItem {
  text: string;
  originalIndex: number;
}

interface OCProfileProps {
  oc: OCWithDetails;
  isOwner: boolean;
  backToSwipe?: string;
  fromOc?: string;
  fromPage?: string;
}

function getField(oc: OCWithDetails, key: string): OCField | undefined {
  return oc.fields.find((f) => f.field_key === key && f.visible !== false && f.skipped !== true);
}

function shuffleArray<T>(arr: T[]): T[] {
  const shuffled = [...arr];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export function OCProfile({ oc, isOwner, backToSwipe, fromOc, fromPage }: OCProfileProps) {
  const router = useRouter();
  const imageUrl = getPublicImageUrl(oc.image_url);
  const [creatorProfile, setCreatorProfile] = useState<Profile | null>(null);

  const shuffledItems = useMemo<ShuffledItem[]>(() => {
    if (!oc.truths_and_lie || oc.truths_and_lie.length !== 3) return [];
    const items = oc.truths_and_lie.map((text, i) => ({ text, originalIndex: i }));
    return shuffleArray(items);
  }, [oc.truths_and_lie]);

  const [guessedIndex, setGuessedIndex] = useState<number | null>(null);

  useEffect(() => {
    async function loadCreator() {
      try {
        const supabase = createClient();
        const { data: profile } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", oc.user_id)
          .single();
        if (profile) setCreatorProfile(profile);

        if (!isOwner) {
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
            recordProfileView(user.id, oc.user_id).catch(() => {});
          }
        }
      } catch {}
    }
    loadCreator();
  }, [oc.user_id, isOwner]);

  function handleBack(e: React.MouseEvent) {
    e.preventDefault();
    if (fromPage === "likes") {
      router.push("/likes");
    } else if (fromPage === "chat") {
      router.push("/chat");
    } else if (fromPage === "dashboard") {
      const saved = sessionStorage.getItem("unhinged_dashboard_scroll");
      if (saved) {
        const y = parseInt(saved, 10);
        sessionStorage.removeItem("unhinged_dashboard_scroll");
        router.push("/", { scroll: false });
        requestAnimationFrame(() => {
          window.scrollTo({ top: y, behavior: "auto" });
        });
      } else {
        router.push("/", { scroll: false });
      }
    } else if (backToSwipe) {
      router.push("/swipe");
    } else {
      const saved = sessionStorage.getItem("unhinged_dashboard_scroll");
      if (saved) {
        const y = parseInt(saved, 10);
        sessionStorage.removeItem("unhinged_dashboard_scroll");
        router.push("/", { scroll: false });
        requestAnimationFrame(() => {
          window.scrollTo({ top: y, behavior: "auto" });
        });
      } else {
        router.push("/", { scroll: false });
      }
    }
  }

  function copyId() {
    navigator.clipboard.writeText(oc.id);
    toast.success("OC ID copied");
  }

  return (
    <>
      <DashboardHeader />
      <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-6 px-4 py-6 pt-20 md:pt-24">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleBack}
            className="gap-1.5 pl-1 text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="size-4" />
            Back
          </Button>
        </div>

        <div className="flex flex-col gap-6 lg:flex-row">
          <div className="flex flex-col gap-4 lg:w-80">
            <div className="relative aspect-[3/4] w-full overflow-hidden rounded-2xl bg-muted ring-1 ring-foreground/10">
              {imageUrl ? (
                <Image
                  src={imageUrl}
                  alt={oc.name}
                  fill
                  className="object-cover"
                  sizes="(max-width: 1024px) 100vw, 320px"
                  priority
                />
              ) : (
                <div className="flex size-full items-center justify-center text-4xl font-bold text-muted-foreground">
                  {getInitials(oc.name)}
                </div>
              )}
            </div>
            <TagPillList tags={oc.tags} max={8} />
            <div className="flex items-center gap-2 rounded-lg border border-border bg-card p-3">
              <code className="flex-1 truncate text-xs text-muted-foreground">{oc.id}</code>
              <Button variant="ghost" size="icon-xs" onClick={copyId} aria-label="Copy OC ID">
                <Copy className="size-3.5" />
              </Button>
            </div>
            {isOwner && (
              <Link href={`/create?edit=${oc.id}`}>
                <Button variant="outline" className="w-full gap-2">
                  <Pencil className="size-4" />
                  Edit OC
                </Button>
              </Link>
            )}
          </div>

          <div className="flex flex-1 flex-col gap-4">
            <div>
              <h1 className="text-3xl font-bold">{oc.name}</h1>
              <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                {getField(oc, "species") && <span>{getField(oc, "species")?.value}</span>}
                {getField(oc, "gender") && (
                  <>
                    <span>•</span>
                    <span>{getField(oc, "gender")?.value}</span>
                  </>
                )}
                {getField(oc, "age") && (
                  <>
                    <span>•</span>
                    <span>{getField(oc, "age")?.value}</span>
                  </>
                )}
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {getField(oc, "height_inches") && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-xs uppercase tracking-wide text-muted-foreground">
                      {getField(oc, "height_inches")?.label}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    {getField(oc, "height_inches")?.value} in
                  </CardContent>
                </Card>
              )}
              {getField(oc, "sexual_orientation") && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-xs uppercase tracking-wide text-muted-foreground">
                      {getField(oc, "sexual_orientation")?.label}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    {getField(oc, "sexual_orientation")?.value}
                  </CardContent>
                </Card>
              )}
              {getField(oc, "romantic_orientation") && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-xs uppercase tracking-wide text-muted-foreground">
                      {getField(oc, "romantic_orientation")?.label}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    {getField(oc, "romantic_orientation")?.value}
                  </CardContent>
                </Card>
              )}
              {getField(oc, "occupation") && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-xs uppercase tracking-wide text-muted-foreground">
                      {getField(oc, "occupation")?.label}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">{getField(oc, "occupation")?.value}</CardContent>
                </Card>
              )}
              {getField(oc, "homeworld") && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-xs uppercase tracking-wide text-muted-foreground">
                      {getField(oc, "homeworld")?.label}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">{getField(oc, "homeworld")?.value}</CardContent>
                </Card>
              )}
            </div>

            {getField(oc, "personality") && (
              <Card>
                <CardHeader>
                  <CardTitle>Personality</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="whitespace-pre-wrap text-sm leading-relaxed">
                    {getField(oc, "personality")?.value}
                  </p>
                </CardContent>
              </Card>
            )}

            {getField(oc, "appearance") && (
              <Card>
                <CardHeader>
                  <CardTitle>Appearance</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="whitespace-pre-wrap text-sm leading-relaxed">
                    {getField(oc, "appearance")?.value}
                  </p>
                </CardContent>
              </Card>
            )}

            {getField(oc, "backstory") && (
              <Card>
                <CardHeader>
                  <CardTitle>Backstory</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="whitespace-pre-wrap text-sm leading-relaxed">
                    {getField(oc, "backstory")?.value}
                  </p>
                </CardContent>
              </Card>
            )}

            {(getField(oc, "likes") || getField(oc, "dislikes")) && (
              <div className="grid gap-4 sm:grid-cols-2">
                {getField(oc, "likes") && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Likes</CardTitle>
                    </CardHeader>
                    <CardContent>{getField(oc, "likes")?.value}</CardContent>
                  </Card>
                )}
                {getField(oc, "dislikes") && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Dislikes</CardTitle>
                    </CardHeader>
                    <CardContent>{getField(oc, "dislikes")?.value}</CardContent>
                  </Card>
                )}
              </div>
            )}

            {shuffledItems.length === 3 && (
              <Card>
                <CardHeader>
                  <CardTitle>Two Truths & a Lie</CardTitle>
                  {!isOwner && guessedIndex === null && (
                    <p className="text-xs text-muted-foreground">Pick the lie — can&apos;t fool you!</p>
                  )}
                </CardHeader>
                <CardContent className="flex flex-col gap-3">
                  {shuffledItems.map((item, i) => {
                    const isLie = item.originalIndex === 2;
                    const isSelected = guessedIndex === i;
                    const revealed = guessedIndex !== null;

                    let borderClass = "border-border bg-muted/30";
                    let icon = null;

                    if (revealed) {
                      if (isLie) {
                        borderClass = "border-destructive/50 bg-destructive/10";
                        icon = <XCircle className="size-4 shrink-0 text-destructive" />;
                      } else if (isSelected) {
                        borderClass = "border-emerald-500/50 bg-emerald-500/10";
                        icon = <CheckCircle className="size-4 shrink-0 text-emerald-500" />;
                      } else {
                        borderClass = "border-border bg-muted/30 opacity-60";
                      }
                    } else if (!isOwner) {
                      borderClass = "border-border bg-muted/30 hover:border-foreground/30 hover:bg-muted/50 cursor-pointer transition-colors";
                    }

                    return (
                      <button
                        key={i}
                        type="button"
                        disabled={isOwner || revealed}
                        onClick={() => setGuessedIndex(i)}
                        className={`flex items-start gap-2 rounded-lg border p-3 text-left text-sm ${borderClass} ${!isOwner && !revealed ? "hover:scale-[1.01] active:scale-[0.99]" : ""} transition-all duration-150`}
                      >
                        <span className="font-semibold whitespace-nowrap">
                          {revealed ? (isLie ? "Lie" : `Truth`) : `#${i + 1}`}
                        </span>
                        <span className="flex-1">{item.text}</span>
                        {icon}
                      </button>
                    );
                  })}
                  {guessedIndex !== null && (
                    <p className={`mt-1 text-sm font-medium ${shuffledItems[guessedIndex].originalIndex === 2 ? "text-emerald-500" : "text-muted-foreground"}`}>
                      {shuffledItems[guessedIndex].originalIndex === 2
                        ? "You caught the lie!"
                        : `Wrong — that was a truth. The lie was #${shuffledItems.findIndex((it) => it.originalIndex === 2) + 1}.`}
                    </p>
                  )}
                </CardContent>
              </Card>
            )}

            {oc.feed && oc.feed.length > 0 && oc.feed[0].visible !== false && (
              <Card>
                <CardHeader>
                  <CardTitle>Open Feed</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="whitespace-pre-wrap text-sm">{oc.feed[0].content}</p>
                </CardContent>
              </Card>
            )}

            <Separator />

            <p className="text-xs text-muted-foreground">
              Created {new Date(oc.created_at || "1970-01-01T00:00:00Z").toLocaleDateString()}
            </p>
          </div>
        </div>

        {creatorProfile && (
          <Link
            href={`/creator/${oc.user_id}`}
            className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-4 backdrop-blur-xl transition-colors hover:bg-white/[0.06]"
          >
            <div className="relative size-10 overflow-hidden rounded-full ring-2 ring-pink-500/30">
              {creatorProfile.creator_avatar_url || creatorProfile.avatar_url ? (
                <Image
                  src={getPublicImageUrl(creatorProfile.creator_avatar_url || creatorProfile.avatar_url)}
                  alt={creatorProfile.creator_name || creatorProfile.username || "Creator"}
                  fill
                  className="object-cover"
                  sizes="40px"
                />
              ) : (
                <div className="flex size-full items-center justify-center bg-zinc-800 text-sm font-bold text-muted-foreground">
                  {getInitials(creatorProfile.creator_name || creatorProfile.username || "?")}
                </div>
              )}
            </div>
            <div className="flex flex-col">
              <span className="text-xs text-muted-foreground">Created by</span>
              <span className="text-sm font-medium text-foreground">
                {creatorProfile.creator_name || creatorProfile.username || "Anonymous"}
              </span>
            </div>
          </Link>
        )}
      </main>
    </>
  );
}

"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Copy, Pencil, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DashboardHeader } from "@/components/layout/DashboardHeader";
import { TagPillList } from "@/components/ui/TagPill";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { OCWithDetails, OCField } from "@/lib/supabase-queries";
import { getPublicImageUrl, getInitials } from "@/lib/utils";
import { toast } from "sonner";

interface OCProfileProps {
  oc: OCWithDetails;
  isOwner: boolean;
  backToSwipe?: string;
  fromOc?: string;
}

function getField(oc: OCWithDetails, key: string): OCField | undefined {
  return oc.fields.find((f) => f.field_key === key && f.visible !== false && f.skipped !== true);
}

export function OCProfile({ oc, isOwner, backToSwipe, fromOc }: OCProfileProps) {
  const router = useRouter();
  const imageUrl = getPublicImageUrl(oc.image_url);

  function handleBack(e: React.MouseEvent) {
    e.preventDefault();
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

  function copyId() {
    navigator.clipboard.writeText(oc.id);
    toast.success("OC ID copied");
  }

  return (
    <>
      <DashboardHeader />
      <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-6 px-4 py-6">
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
          {backToSwipe && (
            <Link
              href={`/swipe?card=${backToSwipe}&oc=${fromOc || ""}`}
              className="flex w-fit items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              Back to Swipe
            </Link>
          )}
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

            {oc.truths_and_lie && oc.truths_and_lie.length === 3 && (
              <Card>
                <CardHeader>
                  <CardTitle>Truths & Lie</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col gap-3">
                  {oc.truths_and_lie.map((item, i) => (
                    <div
                      key={i}
                      className={`rounded-lg border p-3 text-sm ${
                        i === 2 ? "border-destructive/30 bg-destructive/10" : "border-border bg-muted/30"
                      }`}
                    >
                      <span className="font-semibold">{i === 2 ? "Lie" : `Truth ${i + 1}`}:</span>{" "}
                      {item}
                    </div>
                  ))}
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
      </main>
    </>
  );
}

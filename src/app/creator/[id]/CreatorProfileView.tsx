"use client";

import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DashboardHeader } from "@/components/layout/DashboardHeader";
import { Tables } from "@/lib/database.types";
import { getPublicImageUrl, getInitials } from "@/lib/utils";

type Profile = Tables<"profiles">;
type OC = Tables<"ocs"> & { fields: { field_key: string; value: string | null; visible: boolean | null }[] };

interface CreatorProfileViewProps {
  profile: Profile;
  ocs: OC[];
}

export function CreatorProfileView({ profile, ocs }: CreatorProfileViewProps) {
  const headerUrl = profile.creator_header_url
    ? getPublicImageUrl(profile.creator_header_url)
    : null;
  const avatarUrl = profile.creator_avatar_url || profile.avatar_url
    ? getPublicImageUrl(profile.creator_avatar_url || profile.avatar_url)
    : null;

  const socialLinks = [
    { key: "tumblr", label: "Tumblr", url: profile.creator_tumblr },
    { key: "twitter", label: "Twitter", url: profile.creator_twitter },
    { key: "bluesky", label: "Bluesky", url: profile.creator_bluesky },
    { key: "instagram", label: "Instagram", url: profile.creator_instagram },
    { key: "artfight", label: "Art Fight", url: profile.creator_artfight },
    { key: "toyhouse", label: "Toyhouse", url: profile.creator_toyhouse },
    { key: "sheezy", label: "Sheezy", url: profile.creator_sheezy },
    { key: "deviantart", label: "DeviantArt", url: profile.creator_deviantart },
    { key: "furaffinity", label: "FurAffinity", url: profile.creator_furaffinity },
    { key: "weasyl", label: "Weasyl", url: profile.creator_weasyl },
    { key: "unvale", label: "Unvale", url: profile.creator_unvale },
    { key: "cara", label: "Cara", url: profile.creator_cara },
  ].filter((l) => l.url && (profile.social_links_visible as Record<string, boolean>)?.[l.key] !== false);

  return (
    <>
      <DashboardHeader />
      <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-6 px-4 py-6 pt-20 md:pt-24">
        <Link href="/swipe" className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="size-4" />
          Back
        </Link>

        {/* Banner */}
        <div className="relative h-48 w-full overflow-hidden rounded-2xl bg-zinc-900 md:h-64">
          {headerUrl ? (
            <Image src={headerUrl} alt="Banner" fill className="object-cover" sizes="(max-width: 768px) 100vw, 896px" priority />
          ) : (
            <div className="flex size-full items-center justify-center text-muted-foreground">No banner</div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
        </div>

        {/* Profile info */}
        <div className="-mt-16 flex flex-col items-center gap-4 md:-mt-20 md:flex-row md:items-end md:gap-6">
          <div className="relative size-28 overflow-hidden rounded-full border-4 border-background ring-2 ring-pink-500/30 md:size-36">
            {avatarUrl ? (
              <Image src={avatarUrl} alt={profile.creator_name || "Creator"} fill className="object-cover" sizes="144px" />
            ) : (
                <div className="flex size-full items-center justify-center bg-zinc-800 text-3xl font-bold text-muted-foreground">
                {getInitials(profile.creator_name || "?")}
              </div>
            )}
          </div>
          <div className="flex flex-col items-center gap-1 text-center md:items-start md:text-left">
            <h1 className="text-2xl font-bold">{profile.creator_name || "Anonymous Creator"}</h1>
          </div>
        </div>

        {/* Bio */}
        {profile.creator_bio && (
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">{profile.creator_bio}</p>
        )}

        {/* Social links */}
        {socialLinks.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {socialLinks.map((link) => (
              <a
                key={link.key}
                href={link.url!}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-white/[0.06] hover:text-foreground"
              >
                {link.label}
                <ExternalLink className="size-3" />
              </a>
            ))}
          </div>
        )}

        {/* OCs */}
        {ocs.length > 0 && (
          <div>
            <h2 className="mb-4 text-lg font-semibold">Characters</h2>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
              {ocs.map((oc) => {
                const img = oc.image_url ? getPublicImageUrl(oc.image_url) : null;
                const species = oc.fields.find((f) => f.field_key === "species" && f.visible !== false)?.value;
                return (
                  <Link key={oc.id} href={`/oc/${oc.id}`} className="group overflow-hidden rounded-xl border border-white/10 bg-white/[0.03] transition-all hover:bg-white/[0.06] hover:ring-1 hover:ring-pink-500/30">
                    <div className="relative aspect-[3/4] w-full overflow-hidden">
                      {img ? (
                        <Image src={img} alt={oc.name} fill className="object-cover transition-transform duration-300 group-hover:scale-105" sizes="(max-width: 640px) 50vw, 25vw" />
                      ) : (
                        <div className="flex size-full items-center justify-center bg-zinc-900 text-2xl font-bold text-muted-foreground">{getInitials(oc.name)}</div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                      <div className="absolute bottom-0 left-0 right-0 p-2">
                        <h3 className="text-xs font-bold text-white truncate">{oc.name}</h3>
                        {species && <p className="text-[10px] text-white/60 truncate">{species}</p>}
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        )}

        {ocs.length === 0 && (
          <p className="text-center text-sm text-muted-foreground">No public characters yet.</p>
        )}
      </main>
    </>
  );
}

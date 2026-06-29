"use client";

import Link from "next/link";
import Image from "next/image";
import { Pencil, Trash2, GripVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TagPillList } from "@/components/ui/TagPill";
import { OCWithDetails } from "@/lib/supabase-queries";
import { GuestOC } from "@/components/auth/AuthProvider";
import { cn, getPublicImageUrl, getInitials } from "@/lib/utils";

interface OCCardProps {
  oc: OCWithDetails | GuestOC;
  onDelete?: () => void;
  draggable?: boolean;
  onDragStart?: (e: React.DragEvent) => void;
  onDragEnd?: (e: React.DragEvent) => void;
  showActions?: boolean;
  view?: "grid" | "list";
  className?: string;
}

function getFieldValue(oc: OCWithDetails | GuestOC, key: string): string | null {
  if ("fields" in oc && Array.isArray(oc.fields)) {
    const field = oc.fields.find((f) => f.field_key === key);
    return field?.value ?? null;
  }
  return null;
}

export function OCCard({
  oc,
  onDelete,
  draggable,
  onDragStart,
  onDragEnd,
  showActions = true,
  view = "grid",
  className,
}: OCCardProps) {
  const imageUrl = getPublicImageUrl(oc.image_url);
  const species = getFieldValue(oc, "species");
  const gender = getFieldValue(oc, "gender");
  const age = getFieldValue(oc, "age");
  const isGuest = "is_guest" in oc === false && !("user_id" in oc);

  if (view === "list") {
    return (
      <div
        className={cn(
          "group/card relative overflow-hidden rounded-xl border border-primary/20 bg-gradient-to-b from-zinc-950/60 to-zinc-950/30 ring-1 ring-white/5 backdrop-blur-sm transition-all duration-300 ease-out hover:border-primary/50 hover:shadow-[0_0_24px_rgba(255,45,123,0.25)]",
          className
        )}
      >
        <Link href={`/oc/${oc.id}`} className="flex items-center gap-3 p-2 md:gap-4 md:p-3">
          {draggable && (
            <div
              draggable
              onDragStart={onDragStart}
              onDragEnd={onDragEnd}
              onPointerDown={(e) => e.stopPropagation()}
              className="drag-handle shrink-0 cursor-grab rounded-md p-1 text-muted-foreground transition-colors hover:bg-white/10 active:cursor-grabbing"
              aria-label="Drag to reorder"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
            >
              <GripVertical className="size-4" />
            </div>
          )}
          <div className="relative size-14 shrink-0 overflow-hidden rounded-lg bg-zinc-900 sm:size-16 md:size-20">
            {imageUrl ? (
              <Image
                src={imageUrl}
                alt={oc.name}
                fill
                className="object-cover transition-transform duration-300 group-hover/card:scale-105"
                sizes="80px"
              />
            ) : (
              <div className="flex size-full items-center justify-center text-sm font-bold text-muted-foreground">
                {getInitials(oc.name)}
              </div>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-sm font-bold md:text-base">{oc.name}</h3>
            <div className="hidden flex-wrap items-center gap-1.5 text-xs text-muted-foreground md:flex">
              {species && <span>{species}</span>}
              {species && gender && <span className="text-white/20">&bull;</span>}
              {gender && <span>{gender}</span>}
              {(species || gender) && age && <span className="text-white/20">&bull;</span>}
              {age && <span>{age}</span>}
            </div>
            <div className="mt-1 hidden sm:block">
              <TagPillList tags={oc.tags} max={3} />
            </div>
          </div>
          {showActions && (
            <div className="flex shrink-0 items-center gap-2">
              <Link
                href={`/create?edit=${oc.id}`}
                onClick={(e) => e.stopPropagation()}
                className="inline-flex"
              >
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1 border-green-500/30 px-2 text-green-500 hover:bg-green-500/10 hover:text-green-400 md:px-3"
                >
                  <Pencil className="size-3.5" />
                  <span className="hidden sm:inline">Edit</span>
                </Button>
              </Link>
              {onDelete && (
                <Button
                  variant="destructive"
                  size="icon-sm"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onDelete();
                  }}
                  aria-label={`Delete ${oc.name}`}
                >
                  <Trash2 className="size-3.5" />
                </Button>
              )}
            </div>
          )}
        </Link>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "group/card flex h-full flex-col overflow-hidden rounded-xl border border-primary/20 bg-gradient-to-b from-zinc-950/60 to-zinc-950/30 ring-1 ring-white/5 backdrop-blur-sm transition-all duration-300 ease-out hover:border-primary/50 hover:shadow-[0_0_24px_rgba(255,45,123,0.25)]",
        className
      )}
    >
      <Link href={`/oc/${oc.id}`} className="relative flex-1 overflow-hidden rounded-t-xl bg-zinc-900">
        {draggable && (
          <div
            draggable
            onDragStart={onDragStart}
            onDragEnd={onDragEnd}
            onPointerDown={(e) => e.stopPropagation()}
            className="drag-handle absolute top-2 left-2 z-20 cursor-grab rounded-md bg-black/50 p-1 text-white/80 backdrop-blur-sm transition-colors hover:bg-black/70 active:cursor-grabbing"
            aria-label="Drag to reorder"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
          >
            <GripVertical className="size-4" />
          </div>
        )}
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={oc.name}
            fill
            className="object-cover transition-transform duration-300 group-hover/card:scale-105"
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          />
        ) : (
          <div className="flex size-full items-center justify-center bg-zinc-900 text-2xl font-bold text-muted-foreground">
            {getInitials(oc.name)}
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-3">
          <h3 className="truncate text-lg font-bold text-white">{oc.name}</h3>
          <div className="flex flex-wrap items-center gap-1.5 text-xs text-white/80">
            {species && <span className="truncate">{species}</span>}
            {species && gender && <span className="text-white/40">&bull;</span>}
            {gender && <span className="truncate">{gender}</span>}
            {(species || gender) && age && <span className="text-white/40">&bull;</span>}
            {age && <span className="truncate">{age}</span>}
          </div>
        </div>
      </Link>
      <div className="flex flex-col gap-2 p-3">
        <TagPillList tags={oc.tags} max={2} />
        {showActions && (
          <div className="mt-auto flex items-center gap-2">
            <Link href={`/create?edit=${oc.id}`} className="flex-1" onClick={(e) => e.stopPropagation()}>
              <Button
                variant="outline"
                size="sm"
                className="w-full gap-1 border-green-500/30 text-green-500 hover:bg-green-500/10 hover:text-green-400"
              >
                <Pencil className="size-3.5" />
                Edit
              </Button>
            </Link>
            {onDelete && (
              <Button
                variant="destructive"
                size="icon-sm"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onDelete();
                }}
                aria-label={`Delete ${oc.name}`}
              >
                <Trash2 className="size-3.5" />
              </Button>
            )}
          </div>
        )}
        {isGuest && (
          <Badge variant="outline" className="w-fit text-[10px]">
            Guest OC
          </Badge>
        )}
      </div>
    </div>
  );
}

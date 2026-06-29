"use client";

import Link from "next/link";
import Image from "next/image";
import { Pencil, Trash2, GripVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
      <Card
        className={cn(
          "group/card relative overflow-hidden rounded-xl bg-card ring-1 ring-foreground/10 transition-all hover:ring-primary/50 hover:shadow-lg hover:shadow-primary/5",
          className
        )}
      >
        <Link href={`/oc/${oc.id}`} className="flex items-center gap-4 p-3">
          {draggable && (
            <div
              draggable
              onDragStart={onDragStart}
              onDragEnd={onDragEnd}
              className="drag-handle shrink-0 cursor-grab rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted active:cursor-grabbing"
              aria-label="Drag to reorder"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
            >
              <GripVertical className="size-4" />
            </div>
          )}
          <div className="relative size-16 shrink-0 overflow-hidden rounded-lg bg-muted">
            {imageUrl ? (
              <Image
                src={imageUrl}
                alt={oc.name}
                fill
                className="object-cover transition-transform duration-300 group-hover/card:scale-105"
                sizes="64px"
              />
            ) : (
              <div className="flex size-full items-center justify-center text-sm font-bold text-muted-foreground">
                {getInitials(oc.name)}
              </div>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-base font-bold">{oc.name}</h3>
            <div className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
              {species && <span>{species}</span>}
              {species && gender && <span>•</span>}
              {gender && <span>{gender}</span>}
              {(species || gender) && age && <span>•</span>}
              {age && <span>{age}</span>}
            </div>
            <div className="mt-1.5 flex flex-wrap gap-1">
              {oc.tags?.slice(0, 4).map((tag) => (
                <Badge key={tag} variant="secondary" className="text-[10px]">
                  {tag}
                </Badge>
              ))}
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
                  className="gap-1 border-green-500/30 text-green-500 hover:bg-green-500/10 hover:text-green-400"
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
        </Link>
      </Card>
    );
  }

  return (
    <Card
      className={cn(
        "group/card relative overflow-hidden rounded-xl bg-card ring-1 ring-foreground/10 transition-all hover:ring-primary/50 hover:shadow-lg hover:shadow-primary/5",
        className
      )}
    >
      {draggable && (
        <div
          draggable
          onDragStart={onDragStart}
          onDragEnd={onDragEnd}
          className="drag-handle absolute top-2 left-2 z-20 cursor-grab rounded-md bg-black/40 p-1 text-white backdrop-blur-sm transition-colors hover:bg-black/60 active:cursor-grabbing"
          aria-label="Drag to reorder"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
        >
          <GripVertical className="size-4" />
        </div>
      )}
      <Link href={`/oc/${oc.id}`} className="block">
        <div className="relative aspect-[3/4] w-full overflow-hidden bg-muted">
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt={oc.name}
              fill
              className="object-cover transition-transform duration-300 group-hover/card:scale-105"
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            />
          ) : (
            <div className="flex size-full items-center justify-center bg-muted text-2xl font-bold text-muted-foreground">
              {getInitials(oc.name)}
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-3">
            <h3 className="text-lg font-bold text-white">{oc.name}</h3>
            <div className="flex flex-wrap items-center gap-1.5 text-xs text-white/80">
              {species && <span>{species}</span>}
              {species && gender && <span className="text-white/50">•</span>}
              {gender && <span>{gender}</span>}
              {(species || gender) && age && <span className="text-white/50">•</span>}
              {age && <span>{age}</span>}
            </div>
          </div>
        </div>
      </Link>
      <CardContent className="flex flex-col gap-2 p-3">
        <div className="flex flex-wrap gap-1">
          {oc.tags?.slice(0, 3).map((tag) => (
            <Badge key={tag} variant="secondary" className="text-[10px]">
              {tag}
            </Badge>
          ))}
        </div>
        {showActions && (
          <div className="flex items-center gap-2">
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
      </CardContent>
    </Card>
  );
}

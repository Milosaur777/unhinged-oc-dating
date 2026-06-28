"use client";

import { Check, Flame, Sparkles, Drama, Moon, Candy, Globe, Palette, Gamepad2, BookOpen, Music } from "lucide-react";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

export interface BadgeOption {
  name: string;
  icon: LucideIcon;
}

const BADGE_OPTIONS: BadgeOption[] = [
  { name: "Verified Chaos", icon: Flame },
  { name: "Soft Soul", icon: Sparkles },
  { name: "Collector", icon: Drama },
  { name: "Night Owl", icon: Moon },
  { name: "Sweet Tooth", icon: Candy },
  { name: "World Traveler", icon: Globe },
  { name: "Artist", icon: Palette },
  { name: "Gamer", icon: Gamepad2 },
  { name: "Bookworm", icon: BookOpen },
  { name: "Musician", icon: Music },
];

interface BadgeSelectorProps {
  selected: BadgeOption[];
  onChange: (badges: BadgeOption[]) => void;
}

export function BadgeSelector({ selected, onChange }: BadgeSelectorProps) {
  function toggle(badge: BadgeOption) {
    const exists = selected.some((s) => s.name === badge.name);
    if (exists) {
      onChange(selected.filter((s) => s.name !== badge.name));
    } else {
      onChange([...selected, badge]);
    }
  }

  return (
    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
      {BADGE_OPTIONS.map((badge) => {
        const isSelected = selected.some((s) => s.name === badge.name);
        const Icon = badge.icon;
        return (
          <button
            key={badge.name}
            type="button"
            onClick={() => toggle(badge)}
            className={cn(
              "flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-all cursor-pointer",
              isSelected
                ? "border-primary bg-primary/10 text-primary"
                : "border-border bg-card text-foreground hover:border-primary/50"
            )}
          >
            <Icon className="size-4" />
            <span className="flex-1 text-left">{badge.name}</span>
            {isSelected && <Check className="size-4" />}
          </button>
        );
      })}
    </div>
  );
}

export { BADGE_OPTIONS };

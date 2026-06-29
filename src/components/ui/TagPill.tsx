"use client";

import { cn } from "@/lib/utils";

interface TagPillProps {
  children: React.ReactNode;
  className?: string;
  onRemove?: () => void;
  removeLabel?: string;
}

export function TagPill({ children, className, onRemove, removeLabel }: TagPillProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border border-primary/60 bg-[#1a1a3e]/90 px-2.5 py-0.5 text-xs font-medium text-primary shadow-[0_0_8px_rgba(255,45,123,0.25)] backdrop-blur-sm transition-all",
        className
      )}
    >
      {children}
      {onRemove && (
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onRemove();
          }}
          className="-mr-0.5 rounded-full p-0.5 text-primary/80 transition-colors hover:bg-primary/20 hover:text-primary"
          aria-label={removeLabel ?? `Remove ${children}`}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M18 6 6 18" />
            <path d="m6 6 12 12" />
          </svg>
        </button>
      )}
    </span>
  );
}

interface TagPillListProps {
  tags?: string[] | null;
  max?: number;
  className?: string;
  pillClassName?: string;
}

export function TagPillList({ tags, max = 3, className, pillClassName }: TagPillListProps) {
  const tagList = tags ?? [];
  const visible = tagList.slice(0, max);
  const overflow = tagList.length - max;

  return (
    <div className={cn("flex flex-wrap items-center gap-1.5", className)}>
      {visible.map((tag) => (
        <TagPill key={tag} className={pillClassName}>
          {tag}
        </TagPill>
      ))}
      {overflow > 0 && (
        <TagPill className={cn("border-primary/40 bg-primary/10 text-primary/90", pillClassName)}>
          +{overflow}
        </TagPill>
      )}
    </div>
  );
}

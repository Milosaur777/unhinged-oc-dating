"use client";

import { useState, KeyboardEvent } from "react";
import { X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface TagInputProps {
  tags: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
  className?: string;
  suggestions?: string[];
}

export function TagInput({
  tags,
  onChange,
  placeholder = "Add tag...",
  className,
  suggestions = [],
}: TagInputProps) {
  const [input, setInput] = useState("");

  function addTag(raw: string) {
    const cleaned = raw.trim().toLowerCase().replace(/[^a-z0-9-_]/g, "");
    if (!cleaned) return;
    if (!tags.includes(cleaned)) {
      onChange([...tags, cleaned]);
    }
    setInput("");
  }

  function removeTag(tag: string) {
    onChange(tags.filter((t) => t !== tag));
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addTag(input);
    } else if (e.key === "Backspace" && !input && tags.length > 0) {
      removeTag(tags[tags.length - 1]);
    }
  }

  const filteredSuggestions = suggestions
    .filter((s) => !tags.includes(s.toLowerCase()))
    .filter((s) => s.toLowerCase().includes(input.toLowerCase()))
    .slice(0, 6);

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <div className="flex min-h-[2rem] flex-wrap items-center gap-1.5 rounded-lg border border-input bg-transparent px-2 py-1.5 focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50 dark:bg-input/30">
        {tags.map((tag) => (
          <Badge
            key={tag}
            variant="secondary"
            className="flex items-center gap-1 px-1.5 py-0.5 text-xs"
          >
            {tag}
            <button
              type="button"
              onClick={() => removeTag(tag)}
              className="rounded-full p-0.5 hover:bg-foreground/10"
              aria-label={`Remove ${tag}`}
            >
              <X className="size-3" />
            </button>
          </Badge>
        ))}
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={() => {
            if (input.trim()) addTag(input);
          }}
          placeholder={tags.length === 0 ? placeholder : ""}
          className="h-auto min-w-[80px] flex-1 border-0 bg-transparent px-1 py-0.5 text-sm shadow-none focus-visible:ring-0"
        />
      </div>
      {filteredSuggestions.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {filteredSuggestions.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => addTag(s)}
              className="rounded-full border border-border px-2 py-0.5 text-xs text-muted-foreground transition-colors hover:border-primary hover:text-primary"
            >
              + {s}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

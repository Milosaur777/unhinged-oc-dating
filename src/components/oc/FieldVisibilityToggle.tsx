"use client";

import { Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface FieldVisibility {
  fieldKey: string;
  label: string;
  visible: boolean;
}

interface FieldVisibilityToggleProps {
  fields: FieldVisibility[];
  onChange: (fields: FieldVisibility[]) => void;
}

export function FieldVisibilityToggle({ fields, onChange }: FieldVisibilityToggleProps) {
  function toggle(key: string) {
    onChange(
      fields.map((f) => (f.fieldKey === key ? { ...f, visible: !f.visible } : f))
    );
  }

  return (
    <div className="grid gap-2">
      {fields.map((field) => (
        <Button
          key={field.fieldKey}
          type="button"
          variant="ghost"
          onClick={() => toggle(field.fieldKey)}
          className={cn(
            "h-auto justify-start gap-2 px-2 py-2 text-sm font-normal",
            field.visible ? "text-foreground" : "text-muted-foreground line-through"
          )}
        >
          {field.visible ? <Eye className="size-4 text-primary" /> : <EyeOff className="size-4" />}
          {field.label}
        </Button>
      ))}
    </div>
  );
}

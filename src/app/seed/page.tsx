"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Upload, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { DashboardHeader } from "@/components/layout/DashboardHeader";
import { useAuth } from "@/components/auth/AuthProvider";
import { createOC, CreateOCInput } from "@/lib/supabase-queries";
import { toast } from "sonner";

// Empty array for batch import of OC characters.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const CHARACTERS: any[] = [];

export default function SeedPage() {
  const router = useRouter();
  const { user, isGuest } = useAuth();
  const [importing, setImporting] = useState(false);
  const [jsonInput, setJsonInput] = useState("");

  async function handleImport() {
    if (!user || isGuest) {
      toast.error("Please sign in to import");
      return;
    }

    let data = CHARACTERS;
    if (jsonInput.trim()) {
      try {
        data = JSON.parse(jsonInput);
        if (!Array.isArray(data)) throw new Error("Input must be an array");
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Invalid JSON");
        return;
      }
    }

    if (data.length === 0) {
      toast.error("Nothing to import");
      return;
    }

    setImporting(true);
    let success = 0;
    for (const char of data) {
      try {
        const input: CreateOCInput = {
          oc: {
            user_id: user.id,
            name: char.name || "Unnamed",
            tags: Array.isArray(char.tags) ? char.tags : [],
            truths_and_lie: Array.isArray(char.truths_and_lie)
              ? char.truths_and_lie
              : [char.truth1 || "", char.truth2 || "", char.lie || ""].filter(Boolean),
            image_url: char.image_url || null,
            is_swipable: true,
            is_premade: false,
          },
          fields: Array.isArray(char.fields) ? char.fields : [],
          feed: char.feed
            ? { content: char.feed, visible: true }
            : { content: "", visible: true },
        };
        await createOC(input);
        success++;
      } catch (err) {
        console.error("Import error", err);
      }
    }
    setImporting(false);
    toast.success(`Imported ${success} of ${data.length} OCs`);
    if (success > 0) router.push("/");
  }

  return (
    <>
      <DashboardHeader />
      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-4 py-6">
        <div>
          <h1 className="text-2xl font-bold">Batch Import</h1>
          <p className="text-sm text-muted-foreground">
            Import an array of OC objects via JSON, or use the empty CHARACTERS array in code.
          </p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-6 ring-1 ring-foreground/10">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="json">OC JSON Array (optional)</Label>
            <Textarea
              id="json"
              value={jsonInput}
              onChange={(e) => setJsonInput(e.target.value)}
              placeholder={`[{"name": "...", "tags": [], "fields": []}]`}
              rows={10}
            />
            <p className="text-xs text-muted-foreground">
              Leave empty to import from the CHARACTERS array in the source code.
            </p>
          </div>
        </div>

        <Button onClick={handleImport} disabled={importing} className="w-full gap-2">
          {importing ? (
            <>Importing...</>
          ) : (
            <>
              <Upload className="size-4" />
              Import OCs
            </>
          )}
        </Button>

        {CHARACTERS.length === 0 && !jsonInput && (
          <div className="flex items-center gap-2 rounded-lg border border-border bg-card p-4 text-sm text-muted-foreground">
            <Check className="size-4 text-primary" />
            CHARACTERS array is empty. Paste JSON above or edit the array in seed/page.tsx.
          </div>
        )}
      </main>
    </>
  );
}

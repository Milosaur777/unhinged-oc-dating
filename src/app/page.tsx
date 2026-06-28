"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus, Frown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DashboardHeader } from "@/components/layout/DashboardHeader";
import { OCCard } from "@/components/oc/OCCard";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/components/auth/AuthProvider";
import { getUserOCs, deleteOC, updateSortOrder, OCWithDetails } from "@/lib/supabase-queries";
import { toast } from "sonner";

export default function DashboardPage() {
  const router = useRouter();
  const { user, isGuest, loading, guestOCs, deleteGuestOC } = useAuth();
  const [ocs, setOcs] = useState<OCWithDetails[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<OCWithDetails | null>(null);
  const [confirmName, setConfirmName] = useState("");
  const [draggingId, setDraggingId] = useState<string | null>(null);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.push("/auth");
      return;
    }
    if (isGuest) return;

    async function load() {
      try {
        const data = await getUserOCs(user!.id);
        const detailed = await Promise.all(
          data.map(async (oc) => {
            const { getOCWithDetails } = await import("@/lib/supabase-queries");
            return getOCWithDetails(oc.id);
          })
        );
        setOcs(detailed.filter(Boolean) as OCWithDetails[]);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to load OCs");
      } finally {
        setDataLoading(false);
      }
    }
    load();
  }, [user, isGuest, loading, router]);

  const guestMapped = useMemo(
    () =>
      isGuest
        ? (guestOCs.map((oc) => ({
            ...oc,
            user_id: "guest",
            is_swipable: false,
            is_premade: false,
            brand: null,
            images: null,
            sort_order: null,
            updated_at: null,
            created_at: oc.created_at,
          })) as unknown as OCWithDetails[])
        : [],
    [isGuest, guestOCs]
  );

  const displayOcs = isGuest ? guestMapped : ocs;

  async function handleDelete() {
    if (!deleteTarget || confirmName !== deleteTarget.name) return;
    try {
      if (isGuest) {
        deleteGuestOC(deleteTarget.id);
      } else {
        await deleteOC(deleteTarget.id);
        setOcs((prev) => prev.filter((oc) => oc.id !== deleteTarget.id));
      }
      toast.success("OC deleted");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete OC");
    } finally {
      setDeleteTarget(null);
      setConfirmName("");
    }
  }

  function handleDragStart(e: React.DragEvent, id: string) {
    setDraggingId(id);
    e.dataTransfer.effectAllowed = "move";
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
  }

  function handleDrop(e: React.DragEvent, targetId: string) {
    e.preventDefault();
    if (!draggingId || draggingId === targetId) return;

    const newOcs = [...ocs];
    const fromIndex = newOcs.findIndex((oc) => oc.id === draggingId);
    const toIndex = newOcs.findIndex((oc) => oc.id === targetId);
    if (fromIndex === -1 || toIndex === -1) return;

    const [moved] = newOcs.splice(fromIndex, 1);
    newOcs.splice(toIndex, 0, moved);
    setOcs(newOcs);

    if (!isGuest) {
      updateSortOrder(
        newOcs.map((oc, index) => ({ id: oc.id, sort_order: index }))
      ).catch(() => toast.error("Failed to save order"));
    }
    setDraggingId(null);
  }

  if (loading) {
    return (
      <>
        <DashboardHeader />
        <main className="mx-auto flex w-full max-w-7xl flex-1 items-center justify-center px-4">
          <div className="text-muted-foreground">Loading...</div>
        </main>
      </>
    );
  }

  if (!user) return null;

  if (dataLoading && !isGuest) {
    return (
      <>
        <DashboardHeader />
        <main className="mx-auto flex w-full max-w-7xl flex-1 items-center justify-center px-4">
          <div className="text-muted-foreground">Loading...</div>
        </main>
      </>
    );
  }

  return (
    <>
      <DashboardHeader />
      <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 px-4 py-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold">Your OCs</h1>
            <p className="text-sm text-muted-foreground">
              {isGuest
                ? "Guest mode — your OCs are stored locally."
                : "Drag cards to reorder your lineup."}
            </p>
          </div>
          <Link href="/create">
            <Button className="w-full gap-2 sm:w-auto">
              <Plus className="size-4" />
              Create New OC
            </Button>
          </Link>
        </div>

        {displayOcs.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 rounded-2xl border border-dashed border-border bg-card/50 py-16">
            <Frown className="size-12 text-muted-foreground" />
            <p className="text-muted-foreground">No OCs yet.</p>
            <Link href="/create">
              <Button>Create your first OC</Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {displayOcs.map((oc) => (
              <div key={oc.id}>
                <OCCard
                  oc={oc}
                  draggable={!isGuest}
                  onDragStart={(e) => handleDragStart(e, oc.id)}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, oc.id)}
                  onDelete={() => setDeleteTarget(oc)}
                />
              </div>
            ))}
          </div>
        )}
      </main>

      <Dialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete OC</DialogTitle>
            <DialogDescription>
              This cannot be undone. Type <strong>{deleteTarget?.name}</strong> to confirm.
            </DialogDescription>
          </DialogHeader>
          <Input
            value={confirmName}
            onChange={(e) => setConfirmName(e.target.value)}
            placeholder="Type OC name"
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={confirmName !== deleteTarget?.name}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

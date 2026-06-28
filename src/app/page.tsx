"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/components/auth/AuthProvider";
import { getUserOCs, deleteOC, updateSortOrder, OCWithDetails } from "@/lib/supabase-queries";
import { toast } from "sonner";

type SortOption =
  | "custom"
  | "name-asc"
  | "name-desc"
  | "created-newest"
  | "created-oldest";

const SORT_LABELS: Record<SortOption, string> = {
  custom: "Custom Order",
  "name-asc": "Alphabetical (A-Z)",
  "name-desc": "Alphabetical (Z-A)",
  "created-newest": "Date Created (Newest)",
  "created-oldest": "Date Created (Oldest)",
};

export default function DashboardPage() {
  const router = useRouter();
  const { user, isGuest, loading, guestOCs, deleteGuestOC } = useAuth();
  const [ocs, setOcs] = useState<OCWithDetails[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<OCWithDetails | null>(null);
  const [confirmName, setConfirmName] = useState("");
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dropIndex, setDropIndex] = useState<number | null>(null);
  const [sort, setSort] = useState<SortOption>("custom");
  const gridRef = useRef<HTMLDivElement>(null);

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

  const displayOcs = useMemo(() => {
    const source = isGuest ? guestMapped : ocs;
    switch (sort) {
      case "name-asc":
        return [...source].sort((a, b) => a.name.localeCompare(b.name));
      case "name-desc":
        return [...source].sort((a, b) => b.name.localeCompare(a.name));
      case "created-newest":
        return [...source].sort(
          (a, b) =>
            new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
        );
      case "created-oldest":
        return [...source].sort(
          (a, b) =>
            new Date(a.created_at || 0).getTime() - new Date(b.created_at || 0).getTime()
        );
      default:
        return source;
    }
  }, [isGuest, guestMapped, ocs, sort]);

  const isCustomSort = sort === "custom";
  const deleteFirstName = useMemo(
    () => deleteTarget?.name.split(" ")[0] ?? "",
    [deleteTarget]
  );

  async function handleDelete() {
    if (!deleteTarget || confirmName.trim().toLowerCase() !== deleteFirstName.toLowerCase()) return;
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
    if (!isCustomSort) return;
    setDraggingId(id);
    e.dataTransfer.effectAllowed = "move";
  }

  function handleDragEnd() {
    setDraggingId(null);
    setDropIndex(null);
  }

  function getCardElements(): HTMLElement[] {
    if (!gridRef.current) return [];
    return Array.from(gridRef.current.children).filter(
      (el): el is HTMLElement => el.hasAttribute("data-card-id")
    );
  }

  function computeDropIndex(e: React.DragEvent): number | null {
    const cards = getCardElements();
    if (cards.length === 0) return 0;

    let nearest = 0;
    let minDistance = Infinity;
    cards.forEach((card, i) => {
      const rect = card.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const distance = Math.hypot(e.clientX - cx, e.clientY - cy);
      if (distance < minDistance) {
        minDistance = distance;
        nearest = i;
      }
    });

    const rect = cards[nearest].getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const after = e.clientX > cx || e.clientY > cy;
    return after ? nearest + 1 : nearest;
  }

  function handleContainerDragOver(e: React.DragEvent) {
    e.preventDefault();
    if (!draggingId) return;
    const index = computeDropIndex(e);
    setDropIndex(index);
  }

  function handleContainerDrop(e: React.DragEvent) {
    e.preventDefault();
    if (!draggingId || dropIndex == null) return;

    const fromIndex = ocs.findIndex((oc) => oc.id === draggingId);
    if (fromIndex === -1) return;

    const newOcs = [...ocs];
    const [moved] = newOcs.splice(fromIndex, 1);
    let toIndex = dropIndex;
    if (fromIndex < toIndex) toIndex--;
    newOcs.splice(toIndex, 0, moved);
    setOcs(newOcs);

    if (!isGuest) {
      updateSortOrder(
        newOcs.map((oc, index) => ({ id: oc.id, sort_order: index }))
      ).catch(() => toast.error("Failed to save order"));
    }
    setDraggingId(null);
    setDropIndex(null);
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
                : isCustomSort
                  ? "Drag cards to reorder your lineup."
                  : SORT_LABELS[sort]}
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <Select value={sort} onValueChange={(v) => setSort(v as SortOption)}>
              <SelectTrigger className="w-full sm:w-[220px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(SORT_LABELS) as SortOption[]).map((key) => (
                  <SelectItem key={key} value={key}>
                    {SORT_LABELS[key]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Link href="/create">
              <Button className="w-full gap-2 sm:w-auto">
                <Plus className="size-4" />
                Create New OC
              </Button>
            </Link>
          </div>
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
          <div
            ref={gridRef}
            onDragOver={handleContainerDragOver}
            onDrop={handleContainerDrop}
            className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5"
          >
            {(() => {
              const items: ReactNode[] = [];
              displayOcs.forEach((oc, index) => {
                if (dropIndex === index && draggingId) {
                  items.push(
                    <div
                      key={`indicator-${index}`}
                      className="col-span-full h-1 rounded bg-primary"
                    />
                  );
                }
                items.push(
                  <div
                    key={oc.id}
                    data-card-id={oc.id}
                    draggable={!isGuest && isCustomSort}
                    onDragStart={(e) => handleDragStart(e, oc.id)}
                    onDragEnd={handleDragEnd}
                    className="h-fit"
                  >
                    <OCCard
                      oc={oc}
                      draggable={!isGuest && isCustomSort}
                      isDragging={draggingId === oc.id}
                      onDelete={() => setDeleteTarget(oc)}
                    />
                  </div>
                );
              });
              if (dropIndex === displayOcs.length && draggingId) {
                items.push(
                  <div
                    key="indicator-end"
                    className="col-span-full h-1 rounded bg-primary"
                  />
                );
              }
              return items;
            })()}
          </div>
        )}
      </main>

      <Dialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete OC</DialogTitle>
            <DialogDescription>
              This cannot be undone. Type <strong>{deleteFirstName}</strong> to confirm.
            </DialogDescription>
          </DialogHeader>
          <Input
            value={confirmName}
            onChange={(e) => setConfirmName(e.target.value)}
            placeholder="Type first name"
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={confirmName.trim().toLowerCase() !== deleteFirstName.toLowerCase()}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

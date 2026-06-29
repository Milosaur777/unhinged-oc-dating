"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import {
  Plus,
  Frown,
  Search,
  LayoutGrid,
  List,
  Users,
  Heart,
  MessageCircle,
  Eye,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { DashboardHeader } from "@/components/layout/DashboardHeader";
import { ChatSidebar } from "@/components/chat/ChatSidebar";
import { OCCard } from "@/components/oc/OCCard";
import { LoginCard } from "@/components/auth/LoginCard";
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
import {
  getUserOCs,
  deleteOC,
  updateSortOrder,
  getProfile,
  getIncomingLikes,
  getChatSessions,
  OCWithDetails,
  Profile,
} from "@/lib/supabase-queries";
import { getPublicImageUrl, cn } from "@/lib/utils";
import { toast } from "sonner";
import Image from "next/image";

type SortOption =
  | "custom"
  | "name-asc"
  | "name-desc"
  | "created-newest"
  | "created-oldest";

type ViewMode = "grid" | "list";

const SORT_LABELS: Record<SortOption, string> = {
  custom: "Custom Order",
  "name-asc": "A-Z",
  "name-desc": "Z-A",
  "created-newest": "Newest",
  "created-oldest": "Oldest",
};

function getFieldValue(oc: OCWithDetails, key: string): string | null {
  return oc.fields.find((f) => f.field_key === key)?.value ?? null;
}

export default function DashboardPage() {
  const { user, isGuest, loading, guestOCs, deleteGuestOC } = useAuth();
  const [ocs, setOcs] = useState<OCWithDetails[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [dataLoading, setDataLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<OCWithDetails | null>(null);
  const [confirmName, setConfirmName] = useState("");
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dropIndex, setDropIndex] = useState<number | null>(null);
  const [sort, setSort] = useState<SortOption>("custom");
  const [view, setView] = useState<ViewMode>("grid");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [tagFilter, setTagFilter] = useState<string>("all");
  const [stats, setStats] = useState({ totalLikes: 0, matches: 0 });
  const gridRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search.trim().toLowerCase()), 300);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    if (loading || !user) return;
    if (isGuest) return;

    async function load() {
      try {
        const [profileData, data] = await Promise.all([
          getProfile(user!.id),
          getUserOCs(user!.id),
        ]);
        setProfile(profileData);
        const detailed = await Promise.all(
          data.map(async (oc) => {
            const { getOCWithDetails } = await import("@/lib/supabase-queries");
            return getOCWithDetails(oc.id);
          })
        );
        setOcs(detailed.filter(Boolean) as OCWithDetails[]);

        const ids = data.map((o) => o.id);
        const [likes, sessions] = await Promise.all([
          ids.length > 0 ? getIncomingLikes(ids) : Promise.resolve([]),
          ids.length > 0 ? getChatSessions(user!.id) : Promise.resolve([]),
        ]);
        setStats({ totalLikes: likes.length, matches: sessions.length });
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to load OCs");
      } finally {
        setDataLoading(false);
      }
    }
    load();
  }, [user, isGuest, loading]);

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

  const filterOptions = useMemo(() => {
    const source = isGuest ? guestMapped : ocs;
    const tags = new Set<string>();

    source.forEach((oc) => {
      oc.tags?.forEach((t) => tags.add(t));
    });

    return {
      tags: Array.from(tags).sort(),
    };
  }, [isGuest, guestMapped, ocs]);

  const filteredOcs = useMemo(() => {
    const source = isGuest ? guestMapped : ocs;
    return source.filter((oc) => {
      if (debouncedSearch && !oc.name.toLowerCase().includes(debouncedSearch)) return false;
      if (tagFilter !== "all" && !oc.tags?.includes(tagFilter)) return false;
      return true;
    });
  }, [isGuest, guestMapped, ocs, debouncedSearch, tagFilter]);

  const displayOcs = useMemo(() => {
    switch (sort) {
      case "name-asc":
        return [...filteredOcs].sort((a, b) => a.name.localeCompare(b.name));
      case "name-desc":
        return [...filteredOcs].sort((a, b) => b.name.localeCompare(a.name));
      case "created-newest":
        return [...filteredOcs].sort(
          (a, b) =>
            new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
        );
      case "created-oldest":
        return [...filteredOcs].sort(
          (a, b) =>
            new Date(a.created_at || 0).getTime() - new Date(b.created_at || 0).getTime()
        );
      default:
        return filteredOcs;
    }
  }, [filteredOcs, sort]);

  const isCustomSort = sort === "custom";
  const hasActiveFilters = debouncedSearch !== "" || tagFilter !== "all";
  const canReorder = isCustomSort && !hasActiveFilters;
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
    if (!canReorder) return;
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
      <main className="flex min-h-screen items-center justify-center px-4">
        <div className="text-muted-foreground">Loading...</div>
      </main>
    );
  }

  if (!user) {
    return <LoginCard />;
  }

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

  const headerUrl = getPublicImageUrl(profile?.creator_header_url);

  return (
    <>
      <DashboardHeader />
      <div className="flex flex-1">
        <ChatSidebar />
        <main className="flex min-w-0 flex-1 flex-col">
          {/* Creator banner */}
          <div
            className={cn(
              "relative h-40 w-full overflow-hidden banner-gradient md:h-56",
              headerUrl && "bg-none"
            )}
          >
            {headerUrl && (
              <Image
                src={headerUrl}
                alt="Creator banner"
                fill
                className="object-cover"
                priority
                sizes="100vw"
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 px-4 py-4 md:px-6 md:py-6">
              <h1 className="text-2xl font-bold md:text-3xl">Your OCs</h1>
              <p className="text-sm text-muted-foreground">
                {isGuest
                  ? "Guest mode — your OCs are stored locally."
                  : "Manage, reorder, and preview your characters."}
              </p>
            </div>
          </div>

          <div className="flex flex-1 flex-col gap-6 px-6 py-6 md:px-8 lg:px-10">
            {/* Stats */}
            <div className="relative max-w-2xl">
              <div className="absolute -inset-4 rounded-3xl bg-primary/10 blur-3xl" aria-hidden="true" />
              <div className="relative grid grid-cols-2 gap-3 sm:grid-cols-4">
                <StatCard
                  icon={Users}
                  label="Total OCs"
                  value={isGuest ? guestMapped.length : ocs.length}
                />
                <StatCard icon={Heart} label="Total Likes" value={isGuest ? 0 : stats.totalLikes} />
                <StatCard
                  icon={MessageCircle}
                  label="Matches"
                  value={isGuest ? 0 : stats.matches}
                />
                <StatCard icon={Eye} label="Profile Views" value={0} />
              </div>
            </div>

            {/* Toolbar */}
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
                <div className="relative flex-1 sm:min-w-56">
                  <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search OCs..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <FilterSelect
                  value={tagFilter}
                  onChange={(v) => setTagFilter(v || "all")}
                  options={filterOptions.tags}
                  placeholder="Tags"
                />
              </div>
              <div className="flex items-center gap-3">
                <Select value={sort} onValueChange={(v) => setSort(v as SortOption)}>
                  <SelectTrigger className="w-full sm:w-44">
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
                <div className="flex items-center rounded-lg border border-border bg-card p-1">
                  <Button
                    variant={view === "grid" ? "secondary" : "ghost"}
                    size="icon-sm"
                    onClick={() => setView("grid")}
                    aria-label="Grid view"
                  >
                    <LayoutGrid className="size-4" />
                  </Button>
                  <Button
                    variant={view === "list" ? "secondary" : "ghost"}
                    size="icon-sm"
                    onClick={() => setView("list")}
                    aria-label="List view"
                  >
                    <List className="size-4" />
                  </Button>
                </div>
                <Link href="/create" className="shrink-0">
                  <Button className="gap-2 shadow-[0_0_16px_rgba(255,45,123,0.35)]">
                    <Plus className="size-4" />
                    <span className="hidden sm:inline">Create OC</span>
                    <span className="sm:hidden">New</span>
                  </Button>
                </Link>
              </div>
            </div>

            {/* OC grid/list */}
            {displayOcs.length === 0 ? (
              <div className="flex flex-1 flex-col items-center justify-center gap-4 rounded-2xl border border-dashed border-border bg-card/50 py-16">
                <Frown className="size-12 text-muted-foreground" />
                <p className="text-muted-foreground">No OCs found.</p>
                <Link href="/create">
                  <Button>Create your first OC</Button>
                </Link>
              </div>
            ) : (
              <div
                ref={gridRef}
                onDragOver={handleContainerDragOver}
                onDrop={handleContainerDrop}
                className={cn(
                  "relative",
                  view === "grid"
                    ? "grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5"
                    : "flex flex-col gap-4"
                )}
              >
                {(() => {
                  const items: ReactNode[] = [];
                  displayOcs.forEach((oc, index) => {
                    if (dropIndex === index && draggingId) {
                      items.push(
                        <div
                          key={`indicator-${index}`}
                          className={cn(
                            "rounded bg-primary",
                            view === "grid" ? "col-span-full h-1" : "h-1 w-full"
                          )}
                        />
                      );
                    }
                    items.push(
                      <div
                        key={oc.id}
                        data-card-id={oc.id}
                        className={cn(
                          "h-fit transition-all",
                          draggingId === oc.id && "opacity-50"
                        )}
                      >
                        <OCCard
                          oc={oc}
                          draggable={!isGuest && canReorder}
                          onDragStart={(e) => handleDragStart(e, oc.id)}
                          onDragEnd={handleDragEnd}
                          onDelete={() => setDeleteTarget(oc)}
                          view={view}
                        />
                      </div>
                    );
                  });
                  if (dropIndex === displayOcs.length && draggingId) {
                    items.push(
                      <div
                        key="indicator-end"
                        className={cn(
                          "rounded bg-primary",
                          view === "grid" ? "col-span-full h-1" : "h-1 w-full"
                        )}
                      />
                    );
                  }
                  return items;
                })()}
              </div>
            )}
          </div>
        </main>
      </div>

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

function StatCard({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: number;
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-card/60 p-4 shadow-[0_0_20px_rgba(255,45,123,0.15)] backdrop-blur-md ring-1 ring-white/5">
      <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 ring-1 ring-primary/20">
        <Icon className="size-5 text-primary" />
      </div>
      <div>
        <p className="text-2xl font-bold leading-none">{value}</p>
        <p className="mt-1 text-xs text-muted-foreground">{label}</p>
      </div>
    </div>
  );
}

function FilterSelect({
  value,
  onChange,
  options,
  placeholder,
}: {
  value: string;
  onChange: (value: string | null) => void;
  options: string[];
  placeholder: string;
}) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="w-full sm:w-36">
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">All {placeholder}s</SelectItem>
        {options.map((opt) => (
          <SelectItem key={opt} value={opt}>
            {opt}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

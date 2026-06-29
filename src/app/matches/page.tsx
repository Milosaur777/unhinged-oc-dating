"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search, Frown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DashboardHeader } from "@/components/layout/DashboardHeader";
import { OCCard } from "@/components/oc/OCCard";
import { useAuth } from "@/components/auth/AuthProvider";
import { getPublicOCs, OCWithDetails } from "@/lib/supabase-queries";
import { toast } from "sonner";

export default function MatchesPage() {
  const router = useRouter();
  const { user, isGuest, loading } = useAuth();
  const [ocs, setOcs] = useState<OCWithDetails[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [query, setQuery] = useState("");

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.push("/auth");
      return;
    }
    if (isGuest) return;

    async function load() {
      try {
        const data = await getPublicOCs(user!.id);
        setOcs(data);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to load matches");
      } finally {
        setDataLoading(false);
      }
    }
    load();
  }, [user, isGuest, loading, router]);

  const filtered = ocs.filter((oc) => {
    const q = query.trim().toLowerCase();
    if (!q) return true;
    const matchesName = oc.name.toLowerCase().includes(q);
    const matchesId = oc.id.toLowerCase().includes(q);
    const matchesTag = oc.tags?.some((t) => t.toLowerCase().includes(q));
    return matchesName || matchesId || matchesTag;
  });

  if (loading) {
    return (
      <>
        <DashboardHeader />
        <main className="flex flex-1 items-center justify-center pt-20 md:pt-24">Loading...</main>
      </>
    );
  }

  if (!user) return null;

  if (dataLoading && !isGuest) {
    return (
      <>
        <DashboardHeader />
        <main className="flex flex-1 items-center justify-center pt-20 md:pt-24">Loading...</main>
      </>
    );
  }

  if (isGuest) {
    return (
      <>
        <DashboardHeader />
        <main className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center gap-4 px-4 pt-20 text-center md:pt-24">
          <Frown className="size-12 text-muted-foreground" />
          <h1 className="text-2xl font-bold">Matches are for logged-in users</h1>
          <p className="text-muted-foreground">Sign in to browse public OCs.</p>
          <Button onClick={() => router.push("/auth/login")}>Sign In</Button>
        </main>
      </>
    );
  }

  return (
    <>
      <DashboardHeader />
      <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 px-4 py-6 pt-20 md:pt-24">
        <div className="flex flex-col gap-4">
          <h1 className="text-2xl font-bold">Browse Matches</h1>
          <div className="relative max-w-md">
            <Search className="absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by Name / ID / Tag..."
              className="pl-9"
            />
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border bg-card/50 py-16">
            <Frown className="size-10 text-muted-foreground" />
            <p className="text-muted-foreground">No matches found.</p>
            {query ? (
              <Button variant="outline" onClick={() => setQuery("")}>
                Clear filters
              </Button>
            ) : (
              <Link href="/swipe">
                <Button>Start Swiping</Button>
              </Link>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {filtered.map((oc) => (
              <Link key={oc.id} href={`/oc/${oc.id}`}>
                <OCCard oc={oc} showActions={false} />
              </Link>
            ))}
          </div>
        )}
      </main>
    </>
  );
}

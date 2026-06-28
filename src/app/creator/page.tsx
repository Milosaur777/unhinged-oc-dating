"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { User, Save, Frown, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

import { DashboardHeader } from "@/components/layout/DashboardHeader";
import { useAuth } from "@/components/auth/AuthProvider";
import { getProfile, upsertProfile, getUserOCs, toggleAllOCSwipable } from "@/lib/supabase-queries";
import { toast } from "sonner";

export default function CreatorPage() {
  const router = useRouter();
  const { user, isGuest, loading } = useAuth();
  const [dataLoading, setDataLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [allSwipable, setAllSwipable] = useState(true);
  const [toggling, setToggling] = useState(false);

  const [form, setForm] = useState({
    username: "",
    displayName: "",
    bio: "",
    creatorName: "",
    creatorBio: "",
    creatorDiscord: "",
    creatorWebsite: "",
    creatorVisible: true,
  });

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.push("/auth");
      return;
    }
    if (isGuest) return;

    async function load() {
      try {
        const [profileData, ocs] = await Promise.all([
          getProfile(user!.id),
          getUserOCs(user!.id),
        ]);
        setForm({
          username: profileData?.username || "",
          displayName: profileData?.display_name || "",
          bio: profileData?.bio || "",
          creatorName: profileData?.creator_name || "",
          creatorBio: profileData?.creator_bio || "",
          creatorDiscord: profileData?.creator_discord || "",
          creatorWebsite: profileData?.creator_website || "",
          creatorVisible: profileData?.creator_visible ?? true,
        });
        setAllSwipable(ocs.every((o) => o.is_swipable));
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to load profile");
      } finally {
        setDataLoading(false);
      }
    }
    load();
  }, [user, isGuest, loading, router]);

  function update<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSave() {
    if (!user || isGuest) return;
    setSaving(true);
    try {
      await upsertProfile({
        id: user.id,
        username: form.username,
        display_name: form.displayName,
        bio: form.bio,
        creator_name: form.creatorName,
        creator_bio: form.creatorBio,
        creator_discord: form.creatorDiscord,
        creator_website: form.creatorWebsite,
        creator_visible: form.creatorVisible,
      });
      toast.success("Profile saved");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save profile");
    } finally {
      setSaving(false);
    }
  }

  async function handleToggleSwipable() {
    if (!user || isGuest) return;
    setToggling(true);
    try {
      const next = !allSwipable;
      await toggleAllOCSwipable(user.id, next);
      setAllSwipable(next);
      toast.success(next ? "All OCs are now swipable" : "All OCs are now hidden");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to toggle");
    } finally {
      setToggling(false);
    }
  }

  if (loading) {
    return (
      <>
        <DashboardHeader />
        <main className="flex flex-1 items-center justify-center">Loading...</main>
      </>
    );
  }

  if (!user) return null;

  if (dataLoading && !isGuest) {
    return (
      <>
        <DashboardHeader />
        <main className="flex flex-1 items-center justify-center">Loading...</main>
      </>
    );
  }

  if (isGuest) {
    return (
      <>
        <DashboardHeader />
        <main className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center gap-4 px-4 text-center">
          <Frown className="size-12 text-muted-foreground" />
          <h1 className="text-2xl font-bold">Creator profile is for logged-in users</h1>
          <Button onClick={() => router.push("/auth/login")}>Sign In</Button>
        </main>
      </>
    );
  }

  return (
    <>
      <DashboardHeader />
      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-4 py-6">
        <div className="flex items-center gap-3">
          <div className="flex size-12 items-center justify-center rounded-2xl bg-primary/10">
            <User className="size-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Creator Profile</h1>
            <p className="text-sm text-muted-foreground">Manage how others see you.</p>
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-6 ring-1 ring-foreground/10">
          <h2 className="mb-4 text-lg font-semibold">Profile Settings</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                value={form.username}
                onChange={(e) => update("username", e.target.value)}
                placeholder="username"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="displayName">Display Name</Label>
              <Input
                id="displayName"
                value={form.displayName}
                onChange={(e) => update("displayName", e.target.value)}
                placeholder="How you appear"
              />
            </div>
            <div className="flex flex-col gap-1.5 sm:col-span-2">
              <Label htmlFor="bio">Bio</Label>
              <Textarea
                id="bio"
                value={form.bio}
                onChange={(e) => update("bio", e.target.value)}
                placeholder="A little about you..."
                rows={3}
              />
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-6 ring-1 ring-foreground/10">
          <h2 className="mb-4 text-lg font-semibold">Creator Card</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="creatorName">Creator Name</Label>
              <Input
                id="creatorName"
                value={form.creatorName}
                onChange={(e) => update("creatorName", e.target.value)}
                placeholder="Your creator alias"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="creatorDiscord">Discord</Label>
              <Input
                id="creatorDiscord"
                value={form.creatorDiscord}
                onChange={(e) => update("creatorDiscord", e.target.value)}
                placeholder="username"
              />
            </div>
            <div className="flex flex-col gap-1.5 sm:col-span-2">
              <Label htmlFor="creatorWebsite">Website</Label>
              <Input
                id="creatorWebsite"
                value={form.creatorWebsite}
                onChange={(e) => update("creatorWebsite", e.target.value)}
                placeholder="https://..."
              />
            </div>
            <div className="flex flex-col gap-1.5 sm:col-span-2">
              <Label htmlFor="creatorBio">Creator Bio</Label>
              <Textarea
                id="creatorBio"
                value={form.creatorBio}
                onChange={(e) => update("creatorBio", e.target.value)}
                placeholder="About you as a creator..."
                rows={3}
              />
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between gap-4">
            <Label htmlFor="creatorVisible">Show creator card on profiles</Label>
            <Button
              id="creatorVisible"
              variant={form.creatorVisible ? "default" : "outline"}
              onClick={() => update("creatorVisible", !form.creatorVisible)}
              className="gap-2"
            >
              {form.creatorVisible ? <Eye className="size-4" /> : <EyeOff className="size-4" />}
              {form.creatorVisible ? "Visible" : "Hidden"}
            </Button>
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-6 ring-1 ring-foreground/10">
          <h2 className="mb-4 text-lg font-semibold">OC Visibility</h2>
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="font-medium">All OCs swipable</p>
              <p className="text-sm text-muted-foreground">
                Toggle whether all your OCs appear in the swipe stack.
              </p>
            </div>
            <Button
              variant={allSwipable ? "default" : "outline"}
              onClick={handleToggleSwipable}
              disabled={toggling}
              className="gap-2"
            >
              {allSwipable ? <Eye className="size-4" /> : <EyeOff className="size-4" />}
              {allSwipable ? "Visible" : "Hidden"}
            </Button>
          </div>
        </div>

        <Button onClick={handleSave} disabled={saving} className="w-full gap-2">
          <Save className="size-4" />
          {saving ? "Saving..." : "Save Profile"}
        </Button>
      </main>
    </>
  );
}

"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  User,
  Save,
  Frown,
  Eye,
  EyeOff,
  Upload,
  X,
  Accessibility,
  Coffee,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

import { DashboardHeader } from "@/components/layout/DashboardHeader";
import { useAuth } from "@/components/auth/AuthProvider";
import {
  getProfile,
  upsertProfile,
  getUserOCs,
  toggleAllOCSwipable,
  uploadImage,
  clearProfileField,
} from "@/lib/supabase-queries";
import { getPublicImageUrl, cn, getInitials } from "@/lib/utils";
import { toast } from "sonner";

const MOBILE_OFFSETS: Record<string, number> = {
  "/headers/Abstract.avif": 55,
  "/headers/Alchemist.avif": 70,
  "/headers/Beach.avif": 70,
  "/headers/Bedroom.avif": 95,
  "/headers/Cantina.avif": 75,
  "/headers/Church.avif": 65,
  "/headers/Dungeon.avif": 85,
  "/headers/Forest.avif": 90,
  "/headers/Gala.avif": 30,
  "/headers/MasterBedroom.avif": 60,
  "/headers/Mine.avif": 95,
  "/headers/NeonBar.avif": 45,
  "/headers/OasisParty.avif": 65,
  "/headers/PrisonCell.avif": 60,
  "/headers/Shrine.avif": 60,
  "/headers/Study.avif": 70,
  "/headers/Tavern.avif": 90,
};

const PRESET_HEADERS = [
  { name: "Abstract", path: "/headers/Abstract.avif" },
  { name: "Alchemist", path: "/headers/Alchemist.avif" },
  { name: "Beach", path: "/headers/Beach.avif" },
  { name: "Bedroom", path: "/headers/Bedroom.avif" },
  { name: "Cantina", path: "/headers/Cantina.avif" },
  { name: "Church", path: "/headers/Church.avif" },
  { name: "Dungeon", path: "/headers/Dungeon.avif" },
  { name: "Forest", path: "/headers/Forest.avif" },
  { name: "Gala", path: "/headers/Gala.avif" },
  { name: "Infinity Pool", path: "/headers/InfinityPoolPenthouse.avif" },
  { name: "Lux Sofa", path: "/headers/LuxSofa.avif" },
  { name: "Master Bedroom", path: "/headers/MasterBedroom.avif" },
  { name: "Mine", path: "/headers/Mine.avif" },
  { name: "Neon Bar", path: "/headers/NeonBar.avif" },
  { name: "Nightsky", path: "/headers/Nightsky.avif" },
  { name: "Oasis Party", path: "/headers/OasisParty.avif" },
  { name: "Prison Cell", path: "/headers/PrisonCell.avif" },
  { name: "Shrine", path: "/headers/Shrine.avif" },
  { name: "Study", path: "/headers/Study.avif" },
  { name: "Tavern", path: "/headers/Tavern.avif" },
];

export default function CreatorPage() {
  const router = useRouter();
  const { user, isGuest, loading } = useAuth();
  const [dataLoading, setDataLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [allSwipable, setAllSwipable] = useState(true);
  const [toggling, setToggling] = useState(false);
  const [uploadingHeader, setUploadingHeader] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const headerInputRef = useRef<HTMLInputElement>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    username: "",
    displayName: "",
    bio: "",
    creatorName: "",
    creatorBio: "",
    creatorDiscord: "",
    creatorWebsite: "",
    creatorKofi: "",
    creatorHeaderUrl: "",
    creatorAvatarUrl: "",
    creatorVisible: true,
    highContrast: false,
    textScaling: false,
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
          creatorKofi: "",
          creatorHeaderUrl: profileData?.creator_header_url || "",
          creatorAvatarUrl: profileData?.creator_avatar_url || "",
          creatorVisible: profileData?.creator_visible ?? true,
          highContrast: false,
          textScaling: false,
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
        creator_header_url: form.creatorHeaderUrl || null,
        creator_avatar_url: form.creatorAvatarUrl || null,
        creator_visible: form.creatorVisible,
      });
      toast.success("Profile saved");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save profile");
    } finally {
      setSaving(false);
    }
  }

  async function handleHeaderUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !user || isGuest) return;
    setUploadingHeader(true);
    try {
      const path = await uploadImage(file, "headers");
      setForm((prev) => ({ ...prev, creatorHeaderUrl: path }));
      toast.success("Banner uploaded — click Save to apply");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to upload banner");
    } finally {
      setUploadingHeader(false);
      if (headerInputRef.current) headerInputRef.current.value = "";
    }
  }

  async function handleRemoveHeader() {
    if (!user || isGuest) return;
    setForm((prev) => ({ ...prev, creatorHeaderUrl: "" }));
    try {
      await clearProfileField(user.id, "creator_header_url");
      toast.success("Banner removed");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to remove banner");
    }
  }

  async function handleAvatarUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !user || isGuest) return;
    setUploadingAvatar(true);
    try {
      const path = await uploadImage(file, "avatars");
      setForm((prev) => ({ ...prev, creatorAvatarUrl: path }));
      toast.success("Avatar uploaded — click Save to apply");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to upload avatar");
    } finally {
      setUploadingAvatar(false);
      if (avatarInputRef.current) avatarInputRef.current.value = "";
    }
  }

  async function handleRemoveAvatar() {
    if (!user || isGuest) return;
    setForm((prev) => ({ ...prev, creatorAvatarUrl: "" }));
    try {
      await clearProfileField(user.id, "creator_avatar_url");
      toast.success("Avatar removed");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to remove avatar");
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
          <h1 className="text-2xl font-bold">Creator profile is for logged-in users</h1>
          <Button onClick={() => router.push("/auth/login")}>Sign In</Button>
        </main>
      </>
    );
  }

  const headerUrl = getPublicImageUrl(form.creatorHeaderUrl);

  return (
    <>
      <DashboardHeader />
      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-4 py-6 pt-20 md:pt-24">
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
          <h2 className="mb-4 text-lg font-semibold">Creator Banner</h2>
          <div
            className={cn(
              "relative flex h-40 w-full items-center justify-center overflow-hidden rounded-xl border border-border bg-muted",
              headerUrl && "bg-none"
            )}
          >
            {headerUrl ? (
              <>
                <div
                  className="absolute inset-0"
                  onContextMenu={(e) => e.preventDefault()}
                  onDragStart={(e) => e.preventDefault()}
                  style={{ userSelect: "none" }}
                >
                  <Image
                    src={headerUrl}
                    alt="Creator banner preview"
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, 672px"
                    draggable={false}
                  />
                </div>
                <div className="absolute inset-0 bg-black/30" />
                <div className="absolute top-2 right-2 z-20 flex gap-2">
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={handleRemoveHeader}
                    className="gap-1"
                  >
                    <X className="size-4" />
                    Remove
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => headerInputRef.current?.click()}
                    disabled={uploadingHeader}
                    className="gap-1"
                  >
                    <Upload className="size-4" />
                    Change
                  </Button>
                </div>
              </>
            ) : (
              <div
                className="flex flex-col items-center gap-2"
                onClick={() => headerInputRef.current?.click()}
              >
                <Upload className="size-8 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">Upload a banner image</p>
              </div>
            )}
            <input
              ref={headerInputRef}
              type="file"
              accept="image/*"
              onChange={handleHeaderUpload}
              className="hidden"
              aria-label="Upload creator banner"
            />
          </div>
          {uploadingHeader && (
            <p className="mt-2 text-sm text-muted-foreground">Uploading banner...</p>
          )}

          {!headerUrl && (
            <div className="mt-4">
              <p className="mb-3 text-sm font-medium text-muted-foreground">Or choose a preset header:</p>
              <div className="grid grid-cols-4 gap-2 sm:grid-cols-5">
                {PRESET_HEADERS.map((h) => (
                  <button
                    key={h.path}
                    type="button"
                    onClick={() => setForm((prev) => ({ ...prev, creatorHeaderUrl: h.path }))}
                    className="group relative flex flex-col overflow-hidden rounded-lg border border-border transition-all hover:border-primary/50 hover:ring-1 hover:ring-primary/30"
                    onContextMenu={(e) => e.preventDefault()}
                    onDragStart={(e) => e.preventDefault()}
                  >
                    <div className="relative aspect-[3/1] w-full">
                      <Image
                        src={h.path}
                        alt={h.name}
                        fill
                    className={cn("object-cover object-right-top md:object-cover", MOBILE_OFFSETS[form.creatorHeaderUrl] != null && "header-mobile-offset")}
                    style={MOBILE_OFFSETS[form.creatorHeaderUrl] != null ? { "--mobile-offset": `${MOBILE_OFFSETS[form.creatorHeaderUrl]}%` } as React.CSSProperties : undefined}
                        sizes="120px"
                        draggable={false}
                      />
                      <div className="absolute inset-0 bg-black/0 transition-colors group-hover:bg-black/20" />
                    </div>
                    <span className="truncate px-1 py-0.5 text-[10px] text-muted-foreground group-hover:text-foreground">{h.name}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-border bg-card p-6 ring-1 ring-foreground/10">
          <h2 className="mb-4 text-lg font-semibold">Creator Avatar</h2>
          <div className="flex items-center gap-4">
            <div
              className="relative"
              onContextMenu={(e) => e.preventDefault()}
              onDragStart={(e) => e.preventDefault()}
              style={{ userSelect: "none" }}
            >
              <Avatar className="size-20 ring-2 ring-primary/20">
                <AvatarImage src={getPublicImageUrl(form.creatorAvatarUrl)} alt="Creator avatar" draggable={false} />
                <AvatarFallback className="text-2xl font-bold">
                  {form.creatorName ? getInitials(form.creatorName) : <User className="size-8 text-primary" />}
                </AvatarFallback>
              </Avatar>
              {form.creatorAvatarUrl && (
                <Button
                  variant="destructive"
                  size="icon-sm"
                  onClick={handleRemoveAvatar}
                  className="absolute -top-1 -right-1 size-6"
                  aria-label="Remove avatar"
                >
                  <X className="size-3" />
                </Button>
              )}
            </div>
            <div className="flex flex-col gap-2">
              <Button
                variant="outline"
                size="sm"
                className="gap-2"
                onClick={() => avatarInputRef.current?.click()}
                disabled={uploadingAvatar}
              >
                <Upload className="size-4" />
                {uploadingAvatar ? "Uploading..." : "Upload avatar"}
              </Button>
              <p className="text-xs text-muted-foreground">
                Recommended: square image, at least 256x256px.
              </p>
            </div>
            <input
              ref={avatarInputRef}
              type="file"
              accept="image/*"
              onChange={handleAvatarUpload}
              className="hidden"
              aria-label="Upload creator avatar"
            />
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
              <Label htmlFor="creatorKofi">
                <span className="inline-flex items-center gap-1.5">
                  <Coffee className="size-4" />
                  Ko-Fi Link
                </span>
              </Label>
              <Input
                id="creatorKofi"
                value={form.creatorKofi}
                onChange={(e) => update("creatorKofi", e.target.value)}
                placeholder="https://ko-fi.com/..."
              />
              <p className="text-xs text-muted-foreground">
                Placeholder — will be wired to your creator card in a future update.
              </p>
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
          <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">
            <Accessibility className="size-5" />
            Accessibility
          </h2>
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="font-medium">High contrast</p>
                <p className="text-sm text-muted-foreground">
                  Increase contrast across the interface.
                </p>
              </div>
              <Switch
                checked={form.highContrast}
                onCheckedChange={(v) => update("highContrast", v)}
                aria-label="High contrast"
              />
            </div>
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="font-medium">Text scaling</p>
                <p className="text-sm text-muted-foreground">
                  Enlarge body text for better readability.
                </p>
              </div>
              <Switch
                checked={form.textScaling}
                onCheckedChange={(v) => update("textScaling", v)}
                aria-label="Text scaling"
              />
            </div>
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

"use client";

import { useEffect, useMemo, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ChevronLeft,
  ChevronRight,
  Dices,
  Upload,
  User,
  Heart,
  Sparkles,
  Eye,
  Palette,
  Briefcase,
  ShieldCheck,
  MessageSquare,
  ImageIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DashboardHeader } from "@/components/layout/DashboardHeader";
import { TagInput } from "@/components/oc/TagInput";
import { FieldVisibilityToggle } from "@/components/oc/FieldVisibilityToggle";
import { BadgeSelector, BadgeOption } from "@/components/badge/BadgeSelector";
import { useAuth, GuestOC } from "@/components/auth/AuthProvider";
import {
  createOC,
  updateOC,
  uploadImage,
  getOCWithDetails,
  OCWithDetails,
  TablesInsert,
} from "@/lib/supabase-queries";
import { generateRandomOC, RANDOM_TRAITS } from "@/lib/random-oc";
import { inchesToFtIn, inchesToCm, generateId } from "@/lib/utils";
import { toast } from "sonner";

const SPECIES = [
  "Human",
  "Elf",
  "Demon",
  "Angel",
  "Android",
  "Werewolf",
  "Vampire",
  "Fae",
  "Neko",
  "Dragonkin",
  "Alien",
  "Ghost",
  "Mermaid",
  "Cyborg",
  "Shapeshifter",
  "Other",
];

const GENDERS = [
  "Female",
  "Male",
  "Non-binary",
  "Genderfluid",
  "Transfeminine",
  "Transmasculine",
  "Agender",
  "Other",
];

const ORIENTATIONS = [
  "Bisexual",
  "Pansexual",
  "Gay",
  "Lesbian",
  "Straight",
  "Asexual",
  "Demisexual",
  "Omnisexual",
  "Other",
];

const OCCUPATIONS = [
  "Bounty Hunter",
  "Coffee Shop Barista",
  "Intergalactic Courier",
  "Underground DJ",
  "Rogue Mage",
  "Tech Engineer",
  "Cafe Owner",
  "Starship Pilot",
  "Street Racer",
  "Archaeologist",
  "Assassin",
  "Artist",
  "Scientist",
  "Thief",
  "Student",
  "Other",
];

const HOMEWORLDS = [
  "Neo-Tokyo",
  "Lunar Colony Alpha",
  "The Feywilds",
  "Inferno-7",
  "Elysium Station",
  "Old Earth",
  "The Undercity",
  "Aethelgard",
  "Mars Dome 4",
  "The Void",
  "Other",
];

interface FormState {
  name: string;
  species: string;
  gender: string;
  genderCustom: string;
  sexualOrientation: string;
  sexualCustom: string;
  romanticOrientation: string;
  romanticCustom: string;
  age: string;
  heightInches: number;
  personality: string;
  tags: string[];
  likes: string;
  dislikes: string;
  appearance: string;
  occupation: string;
  homeworld: string;
  backstory: string;
  truth1: string;
  truth2: string;
  lie: string;
  openFeed: string;
  imageUrl: string | null;
  imageFile: File | null;
  fieldVisibility: Record<string, boolean>;
  badges: BadgeOption[];
}

const DEFAULT_VISIBILITY: Record<string, boolean> = {
  species: true,
  gender: true,
  sexual_orientation: true,
  romantic_orientation: true,
  age: true,
  height_inches: true,
  personality: true,
  likes: true,
  dislikes: true,
  appearance: true,
  occupation: true,
  homeworld: true,
  backstory: true,
};

const STEPS = [
  { label: "Basic", icon: User },
  { label: "Personality", icon: Heart },
  { label: "Appearance", icon: Palette },
  { label: "Background", icon: Briefcase },
  { label: "Truths", icon: ShieldCheck },
  { label: "Feed", icon: MessageSquare },
  { label: "Image", icon: ImageIcon },
  { label: "Visibility", icon: Eye },
];

export default function CreateOCPage() {
  return (
    <Suspense fallback={<CreateOCLoading />}>
      <CreateOCForm />
    </Suspense>
  );
}

function CreateOCLoading() {
  return (
    <>
      <DashboardHeader />
      <main className="flex flex-1 items-center justify-center">Loading...</main>
    </>
  );
}

function CreateOCForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get("edit");
  const { user, isGuest, loading, addGuestOC, updateGuestOC, getGuestOC } = useAuth();

  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<FormState>({
    name: "",
    species: SPECIES[0],
    gender: GENDERS[0],
    genderCustom: "",
    sexualOrientation: ORIENTATIONS[0],
    sexualCustom: "",
    romanticOrientation: ORIENTATIONS[0],
    romanticCustom: "",
    age: "",
    heightInches: 66,
    personality: "",
    tags: [],
    likes: "",
    dislikes: "",
    appearance: "",
    occupation: OCCUPATIONS[0],
    homeworld: HOMEWORLDS[0],
    backstory: "",
    truth1: "",
    truth2: "",
    lie: "",
    openFeed: "",
    imageUrl: null,
    imageFile: null,
    fieldVisibility: { ...DEFAULT_VISIBILITY },
    badges: [],
  });

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function populateFromOC(oc: OCWithDetails) {
    const get = (key: string) => oc.fields.find((f) => f.field_key === key)?.value ?? "";
    setForm({
      name: oc.name,
      species: oc.fields.find((f) => f.field_key === "species")?.value || SPECIES[0],
      gender: oc.fields.find((f) => f.field_key === "gender")?.value || GENDERS[0],
      genderCustom: "",
      sexualOrientation: oc.fields.find((f) => f.field_key === "sexual_orientation")?.value || ORIENTATIONS[0],
      sexualCustom: "",
      romanticOrientation: oc.fields.find((f) => f.field_key === "romantic_orientation")?.value || ORIENTATIONS[0],
      romanticCustom: "",
      age: oc.fields.find((f) => f.field_key === "age")?.value || "",
      heightInches: parseInt(oc.fields.find((f) => f.field_key === "height_inches")?.value || "66", 10),
      personality: get("personality"),
      tags: oc.tags ?? [],
      likes: get("likes"),
      dislikes: get("dislikes"),
      appearance: get("appearance"),
      occupation: get("occupation") || OCCUPATIONS[0],
      homeworld: get("homeworld") || HOMEWORLDS[0],
      backstory: get("backstory"),
      truth1: oc.truths_and_lie?.[0] || "",
      truth2: oc.truths_and_lie?.[1] || "",
      lie: oc.truths_and_lie?.[2] || "",
      openFeed: oc.feed?.[0]?.content || "",
      imageUrl: oc.image_url,
      imageFile: null,
      fieldVisibility: oc.fields.reduce(
        (acc, f) => {
          if (DEFAULT_VISIBILITY[f.field_key] !== undefined) {
            acc[f.field_key] = f.visible !== false;
          }
          return acc;
        },
        { ...DEFAULT_VISIBILITY }
      ),
      badges: [],
    });
  }

  function populateFromGuest(oc: GuestOC) {
    setForm({
      name: oc.name,
      species: oc.fields.find((f) => f.field_key === "species")?.value || SPECIES[0],
      gender: oc.fields.find((f) => f.field_key === "gender")?.value || GENDERS[0],
      genderCustom: "",
      sexualOrientation: oc.fields.find((f) => f.field_key === "sexual_orientation")?.value || ORIENTATIONS[0],
      sexualCustom: "",
      romanticOrientation: oc.fields.find((f) => f.field_key === "romantic_orientation")?.value || ORIENTATIONS[0],
      romanticCustom: "",
      age: oc.fields.find((f) => f.field_key === "age")?.value || "",
      heightInches: parseInt(oc.fields.find((f) => f.field_key === "height_inches")?.value || "66", 10),
      personality: oc.fields.find((f) => f.field_key === "personality")?.value || "",
      tags: oc.tags ?? [],
      likes: oc.fields.find((f) => f.field_key === "likes")?.value || "",
      dislikes: oc.fields.find((f) => f.field_key === "dislikes")?.value || "",
      appearance: oc.fields.find((f) => f.field_key === "appearance")?.value || "",
      occupation: oc.fields.find((f) => f.field_key === "occupation")?.value || OCCUPATIONS[0],
      homeworld: oc.fields.find((f) => f.field_key === "homeworld")?.value || HOMEWORLDS[0],
      backstory: oc.fields.find((f) => f.field_key === "backstory")?.value || "",
      truth1: oc.truths_and_lie?.[0] || "",
      truth2: oc.truths_and_lie?.[1] || "",
      lie: oc.truths_and_lie?.[2] || "",
      openFeed: "",
      imageUrl: oc.image_url,
      imageFile: null,
      fieldVisibility: { ...DEFAULT_VISIBILITY },
      badges: [],
    });
  }

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.push("/auth");
      return;
    }
    if (editId && isGuest) {
      const guest = getGuestOC(editId);
      if (guest) {
        queueMicrotask(() => populateFromGuest(guest));
      }
    } else if (editId) {
      getOCWithDetails(editId).then((oc) => {
        if (oc) populateFromOC(oc);
      });
    }
  }, [user, loading, editId, isGuest, getGuestOC, router]);

  function handleRandomize() {
    const random = generateRandomOC();
    setForm((prev) => ({
      ...prev,
      name: random.name,
      species: random.species,
      gender: random.gender,
      genderCustom: "",
      sexualOrientation: random.sexualOrientation,
      sexualCustom: "",
      romanticOrientation: random.romanticOrientation,
      romanticCustom: "",
      age: String(random.age),
      heightInches: random.heightInches,
      personality: random.personality,
      tags: random.tags,
      likes: random.likes,
      dislikes: random.dislikes,
      appearance: random.appearance,
      occupation: random.occupation,
      homeworld: random.homeworld,
      backstory: random.backstory,
      truth1: random.truths[0],
      truth2: random.truths[1],
      lie: random.lie,
      openFeed: random.openFeed,
    }));
    toast.success("Random OC generated");
  }

  function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setForm((prev) => ({ ...prev, imageUrl: url, imageFile: file }));
  }

  const heightDisplay = useMemo(
    () => `${inchesToFtIn(form.heightInches)} / ${inchesToCm(form.heightInches)} cm`,
    [form.heightInches]
  );

  function makeField(
    key: string,
    label: string,
    value: string,
    fieldType: string
  ): Omit<TablesInsert<"oc_fields">, "id" | "oc_id"> {
    return {
      field_key: key,
      label,
      field_type: fieldType,
      value,
      visible: form.fieldVisibility[key] ?? true,
      skipped: false,
    };
  }

  async function handleSave() {
    if (!form.name.trim()) {
      toast.error("Name is required");
      setStep(0);
      return;
    }

    setSaving(true);
    try {
      let imagePath = form.imageUrl;
      if (form.imageFile) {
        imagePath = await uploadImage(form.imageFile);
      }

      const genderValue = form.gender === "Other" ? form.genderCustom || "Other" : form.gender;
      const sexualValue =
        form.sexualOrientation === "Other" ? form.sexualCustom || "Other" : form.sexualOrientation;
      const romanticValue =
        form.romanticOrientation === "Other" ? form.romanticCustom || "Other" : form.romanticOrientation;

      const fields: Omit<TablesInsert<"oc_fields">, "id" | "oc_id">[] = [
        makeField("species", "Species", form.species, "select"),
        makeField("gender", "Gender", genderValue, "select"),
        makeField("sexual_orientation", "Sexual Orientation", sexualValue, "select"),
        makeField("romantic_orientation", "Romantic Orientation", romanticValue, "select"),
        makeField("age", "Age", form.age, "text"),
        makeField("height_inches", "Height", String(form.heightInches), "number"),
        makeField("personality", "Personality", form.personality, "textarea"),
        makeField("likes", "Likes", form.likes, "text"),
        makeField("dislikes", "Dislikes", form.dislikes, "text"),
        makeField("appearance", "Appearance", form.appearance, "textarea"),
        makeField("occupation", "Occupation", form.occupation, "select"),
        makeField("homeworld", "Homeworld", form.homeworld, "select"),
        makeField("backstory", "Backstory", form.backstory, "textarea"),
      ];

      const truthsAndLie = [form.truth1, form.truth2, form.lie].filter(Boolean);

      if (isGuest) {
        const guestOC: GuestOC = {
          id: editId || generateId(),
          name: form.name,
          image_url: imagePath,
          fields: fields.map((f) => ({
            field_key: f.field_key,
            value: f.value ?? null,
            label: f.label,
          })),
          tags: form.tags,
          truths_and_lie: truthsAndLie,
          created_at: new Date().toISOString(),
        };
        if (editId) {
          updateGuestOC(guestOC);
        } else {
          addGuestOC(guestOC);
        }
        toast.success(editId ? "OC updated" : "OC created");
        router.push("/");
        return;
      }

      const ocData: TablesInsert<"ocs"> = {
        user_id: user!.id,
        name: form.name,
        tags: form.tags,
        truths_and_lie: truthsAndLie,
        image_url: imagePath,
        is_swipable: true,
        is_premade: false,
      };

      const feedData: Omit<TablesInsert<"oc_open_feed">, "id" | "oc_id"> = {
        content: form.openFeed,
        visible: true,
      };

      if (editId) {
        await updateOC({ ocId: editId, oc: { ...ocData, id: editId }, fields, feed: feedData });
      } else {
        await createOC({ oc: ocData, fields, feed: feedData });
      }

      toast.success(editId ? "OC updated" : "OC created");
      router.push("/");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save OC");
    } finally {
      setSaving(false);
    }
  }

  if (loading || !user) {
    return (
      <>
        <DashboardHeader />
        <main className="flex flex-1 items-center justify-center">Loading...</main>
      </>
    );
  }

  return (
    <>
      <DashboardHeader />
      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-4 py-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">{editId ? "Edit OC" : "Create OC"}</h1>
          <Button variant="outline" onClick={handleRandomize} className="gap-2">
            <Dices className="size-4" />
            Random
          </Button>
        </div>

        <div className="flex items-center justify-between rounded-lg bg-muted p-1">
          {STEPS.map((s, index) => {
            const Icon = s.icon;
            const active = index === step;
            const completed = index < step;
            return (
              <button
                key={s.label}
                type="button"
                onClick={() => setStep(index)}
                className={`flex flex-1 flex-col items-center gap-1 rounded-md py-2 text-[10px] font-medium transition-colors sm:flex-row sm:justify-center sm:gap-1.5 sm:text-xs ${
                  active
                    ? "bg-card text-primary"
                    : completed
                      ? "text-foreground"
                      : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Icon className="size-3.5 sm:size-4" />
                <span className="hidden sm:inline">{s.label}</span>
              </button>
            );
          })}
        </div>

        <div className="rounded-2xl border border-border bg-card p-6 ring-1 ring-foreground/10">
          {step === 0 && (
            <div className="flex flex-col gap-4">
              <h2 className="text-lg font-semibold">Basic Info</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="flex flex-col gap-1.5 sm:col-span-2">
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    value={form.name}
                    onChange={(e) => update("name", e.target.value)}
                    placeholder="Character name"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label>Species</Label>
                  <Select value={form.species} onValueChange={(v) => v && update("species", v)}>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {SPECIES.map((s) => (
                        <SelectItem key={s} value={s}>
                          {s}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label>Gender</Label>
                  <Select value={form.gender} onValueChange={(v) => v && update("gender", v)}>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {GENDERS.map((g) => (
                        <SelectItem key={g} value={g}>
                          {g}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {form.gender === "Other" && (
                    <Input
                      value={form.genderCustom}
                      onChange={(e) => update("genderCustom", e.target.value)}
                      placeholder="Specify gender"
                      className="mt-1"
                    />
                  )}
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label>Sexual Orientation</Label>
                  <Select
                    value={form.sexualOrientation}
                    onValueChange={(v) => v && update("sexualOrientation", v)}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ORIENTATIONS.map((o) => (
                        <SelectItem key={o} value={o}>
                          {o}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {form.sexualOrientation === "Other" && (
                    <Input
                      value={form.sexualCustom}
                      onChange={(e) => update("sexualCustom", e.target.value)}
                      placeholder="Specify orientation"
                      className="mt-1"
                    />
                  )}
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label>Romantic Orientation</Label>
                  <Select
                    value={form.romanticOrientation}
                    onValueChange={(v) => v && update("romanticOrientation", v)}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ORIENTATIONS.map((o) => (
                        <SelectItem key={o} value={o}>
                          {o}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {form.romanticOrientation === "Other" && (
                    <Input
                      value={form.romanticCustom}
                      onChange={(e) => update("romanticCustom", e.target.value)}
                      placeholder="Specify orientation"
                      className="mt-1"
                    />
                  )}
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="age">Age</Label>
                  <Input
                    id="age"
                    value={form.age}
                    onChange={(e) => update("age", e.target.value)}
                    placeholder="25"
                  />
                </div>
                <div className="flex flex-col gap-1.5 sm:col-span-2">
                  <Label>Height</Label>
                  <div className="flex items-center gap-4">
                    <input
                      type="range"
                      min={36}
                      max={96}
                      value={form.heightInches}
                      onChange={(e) => update("heightInches", parseInt(e.target.value, 10))}
                      className="flex-1 accent-primary"
                    />
                    <span className="min-w-[110px] text-right text-sm font-medium">{heightDisplay}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="flex flex-col gap-4">
              <h2 className="text-lg font-semibold">Personality</h2>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="personality">Personality Description</Label>
                <Textarea
                  id="personality"
                  value={form.personality}
                  onChange={(e) => update("personality", e.target.value)}
                  placeholder="What makes them tick?"
                  rows={4}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>Tags</Label>
                <TagInput
                  tags={form.tags}
                  onChange={(tags) => update("tags", tags)}
                  suggestions={RANDOM_TRAITS}
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="likes">Likes</Label>
                  <Input
                    id="likes"
                    value={form.likes}
                    onChange={(e) => update("likes", e.target.value)}
                    placeholder="Comma separated"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="dislikes">Dislikes</Label>
                  <Input
                    id="dislikes"
                    value={form.dislikes}
                    onChange={(e) => update("dislikes", e.target.value)}
                    placeholder="Comma separated"
                  />
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="flex flex-col gap-4">
              <h2 className="text-lg font-semibold">Appearance</h2>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="appearance">Appearance Description</Label>
                <Textarea
                  id="appearance"
                  value={form.appearance}
                  onChange={(e) => update("appearance", e.target.value)}
                  placeholder="What do they look like?"
                  rows={6}
                />
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="flex flex-col gap-4">
              <h2 className="text-lg font-semibold">Background</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="flex flex-col gap-1.5">
                  <Label>Occupation</Label>
                  <Select value={form.occupation} onValueChange={(v) => v && update("occupation", v)}>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {OCCUPATIONS.map((o) => (
                        <SelectItem key={o} value={o}>
                          {o}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label>Homeworld</Label>
                  <Select value={form.homeworld} onValueChange={(v) => v && update("homeworld", v)}>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {HOMEWORLDS.map((h) => (
                        <SelectItem key={h} value={h}>
                          {h}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="backstory">Backstory</Label>
                <Textarea
                  id="backstory"
                  value={form.backstory}
                  onChange={(e) => update("backstory", e.target.value)}
                  placeholder="Where do they come from?"
                  rows={6}
                />
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="flex flex-col gap-4">
              <h2 className="text-lg font-semibold">Truths & Lie</h2>
              <p className="text-sm text-muted-foreground">
                Enter two truths and one lie about your OC.
              </p>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="truth1">Truth #1</Label>
                <Input
                  id="truth1"
                  value={form.truth1}
                  onChange={(e) => update("truth1", e.target.value)}
                  placeholder="Something true"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="truth2">Truth #2</Label>
                <Input
                  id="truth2"
                  value={form.truth2}
                  onChange={(e) => update("truth2", e.target.value)}
                  placeholder="Something else true"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="lie">Lie</Label>
                <Input
                  id="lie"
                  value={form.lie}
                  onChange={(e) => update("lie", e.target.value)}
                  placeholder="Something false"
                />
              </div>
            </div>
          )}

          {step === 5 && (
            <div className="flex flex-col gap-4">
              <h2 className="text-lg font-semibold">Open Feed</h2>
              <p className="text-sm text-muted-foreground">
                A public post visible on their profile.
              </p>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="feed">Feed Content</Label>
                <Textarea
                  id="feed"
                  value={form.openFeed}
                  onChange={(e) => update("openFeed", e.target.value)}
                  placeholder="What is on their mind?"
                  rows={4}
                />
              </div>
            </div>
          )}

          {step === 6 && (
            <div className="flex flex-col gap-4">
              <h2 className="text-lg font-semibold">Profile Image</h2>
              <div className="flex flex-col items-center gap-4">
                <div className="relative flex size-40 items-center justify-center overflow-hidden rounded-2xl border border-border bg-muted">
                  {form.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={form.imageUrl}
                      alt="Preview"
                      className="size-full object-cover"
                    />
                  ) : (
                    <ImageIcon className="size-12 text-muted-foreground" />
                  )}
                </div>
                <Label
                  htmlFor="image-upload"
                  className="flex cursor-pointer items-center gap-2 rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium transition-colors hover:border-primary hover:text-primary"
                >
                  <Upload className="size-4" />
                  Upload Image
                </Label>
                <input
                  id="image-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="sr-only"
                />
              </div>
            </div>
          )}

          {step === 7 && (
            <div className="flex flex-col gap-4">
              <h2 className="text-lg font-semibold">Visibility & Badges</h2>
              <div className="grid gap-6 sm:grid-cols-2">
                <div className="flex flex-col gap-2">
                  <Label>Visible Fields</Label>
                  <FieldVisibilityToggle
                    fields={[
                      { fieldKey: "species", label: "Species", visible: form.fieldVisibility.species },
                      { fieldKey: "gender", label: "Gender", visible: form.fieldVisibility.gender },
                      {
                        fieldKey: "sexual_orientation",
                        label: "Sexual Orientation",
                        visible: form.fieldVisibility.sexual_orientation,
                      },
                      {
                        fieldKey: "romantic_orientation",
                        label: "Romantic Orientation",
                        visible: form.fieldVisibility.romantic_orientation,
                      },
                      { fieldKey: "age", label: "Age", visible: form.fieldVisibility.age },
                      { fieldKey: "height_inches", label: "Height", visible: form.fieldVisibility.height_inches },
                      { fieldKey: "personality", label: "Personality", visible: form.fieldVisibility.personality },
                      { fieldKey: "likes", label: "Likes", visible: form.fieldVisibility.likes },
                      { fieldKey: "dislikes", label: "Dislikes", visible: form.fieldVisibility.dislikes },
                      { fieldKey: "appearance", label: "Appearance", visible: form.fieldVisibility.appearance },
                      { fieldKey: "occupation", label: "Occupation", visible: form.fieldVisibility.occupation },
                      { fieldKey: "homeworld", label: "Homeworld", visible: form.fieldVisibility.homeworld },
                      { fieldKey: "backstory", label: "Backstory", visible: form.fieldVisibility.backstory },
                    ]}
                    onChange={(fields) =>
                      update(
                        "fieldVisibility",
                        fields.reduce(
                          (acc, f) => {
                            acc[f.fieldKey] = f.visible;
                            return acc;
                          },
                          { ...form.fieldVisibility }
                        )
                      )
                    }
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Label>Badges</Label>
                  <BadgeSelector selected={form.badges} onChange={(badges) => update("badges", badges)} />
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            onClick={() => setStep((s) => Math.max(0, s - 1))}
            disabled={step === 0}
            className="gap-1"
          >
            <ChevronLeft className="size-4" />
            Back
          </Button>
          {step < STEPS.length - 1 ? (
            <Button onClick={() => setStep((s) => Math.min(STEPS.length - 1, s + 1))} className="gap-1">
              Next
              <ChevronRight className="size-4" />
            </Button>
          ) : (
            <Button onClick={handleSave} disabled={saving} className="gap-1">
              <Sparkles className="size-4" />
              {saving ? "Saving..." : editId ? "Update OC" : "Create OC"}
            </Button>
          )}
        </div>
      </main>
    </>
  );
}

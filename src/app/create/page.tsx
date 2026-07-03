"use client";

import { useEffect, useMemo, useState, Suspense, Fragment, type ReactNode } from "react";
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
  EyeOff,
  Palette,
  Briefcase,
  ShieldCheck,
  MessageSquare,
  ImageIcon,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DashboardHeader } from "@/components/layout/DashboardHeader";
import { TagInput } from "@/components/oc/TagInput";
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
import { inchesToFtIn, inchesToCm, generateId, getPublicImageUrl } from "@/lib/utils";
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
  "Dwarf",
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

interface GalleryItem {
  preview: string;
  path: string | null;
  file: File | null;
}

interface FormState {
  name: string;
  species: string;
  speciesCustom: string;
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
  galleryImages: GalleryItem[];
  fieldVisibility: Record<string, boolean>;
  skippedFields: Record<string, boolean>;
  badges: BadgeOption[];
  isHidden: boolean;
}

const DEFAULT_VISIBILITY: Record<string, boolean> = {
  name: true,
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
  truth1: true,
  truth2: true,
  lie: true,
  openFeed: true,
  tags: true,
};

const DEFAULT_SKIPPED: Record<string, boolean> = {
  species: false,
  gender: false,
  sexual_orientation: false,
  romantic_orientation: false,
  age: false,
  height_inches: false,
  personality: false,
  likes: false,
  dislikes: false,
  appearance: false,
  occupation: false,
  homeworld: false,
  backstory: false,
  truth1: false,
  truth2: false,
  lie: false,
  openFeed: false,
  tags: false,
};

const STEPS = [
  { label: "Basic", icon: User },
  { label: "Personality", icon: Heart },
  { label: "Appearance", icon: Palette },
  { label: "Background", icon: Briefcase },
  { label: "Truths", icon: ShieldCheck },
  { label: "Feed", icon: MessageSquare },
  { label: "Image", icon: ImageIcon },
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
      <main className="flex flex-1 items-center justify-center pt-20 md:pt-24">Loading...</main>
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
    speciesCustom: "",
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
    galleryImages: [],
    fieldVisibility: { ...DEFAULT_VISIBILITY },
    skippedFields: { ...DEFAULT_SKIPPED },
    badges: [],
    isHidden: false,
  });

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function updateVisibility(key: string, visible: boolean) {
    setForm((prev) => ({
      ...prev,
      fieldVisibility: { ...prev.fieldVisibility, [key]: visible },
    }));
  }

  function updateSkipped(key: string, skipped: boolean) {
    setForm((prev) => ({
      ...prev,
      skippedFields: { ...prev.skippedFields, [key]: skipped },
    }));
  }

  function populateFromOC(oc: OCWithDetails) {
    const get = (key: string) => oc.fields.find((f) => f.field_key === key)?.value ?? "";
    const gallery: GalleryItem[] = (oc.images ?? []).map((path) => ({
      preview: getPublicImageUrl(path),
      path,
      file: null,
    }));
    const rawSpecies = oc.fields.find((f) => f.field_key === "species")?.value || SPECIES[0];
    const isCustomSpecies = !SPECIES.includes(rawSpecies);
    setForm({
      name: oc.name,
      species: isCustomSpecies ? "Other" : rawSpecies,
      speciesCustom: isCustomSpecies ? rawSpecies : "",
      gender: oc.fields.find((f) => f.field_key === "gender")?.value || GENDERS[0],
      genderCustom: "",
      sexualOrientation:
        oc.fields.find((f) => f.field_key === "sexual_orientation")?.value || ORIENTATIONS[0],
      sexualCustom: "",
      romanticOrientation:
        oc.fields.find((f) => f.field_key === "romantic_orientation")?.value || ORIENTATIONS[0],
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
      galleryImages: gallery,
      fieldVisibility: oc.fields.reduce(
        (acc, f) => {
          if (DEFAULT_VISIBILITY[f.field_key] !== undefined) {
            acc[f.field_key] = f.visible !== false;
          }
          return acc;
        },
        { ...DEFAULT_VISIBILITY }
      ),
      skippedFields: oc.fields.reduce(
        (acc, f) => {
          if (DEFAULT_SKIPPED[f.field_key] !== undefined) {
            acc[f.field_key] = f.skipped === true;
          }
          return acc;
        },
        { ...DEFAULT_SKIPPED }
      ),
      badges: [],
      isHidden: oc.is_hidden ?? false,
    });
  }

  function populateFromGuest(oc: GuestOC) {
    const rawSpecies = oc.fields.find((f) => f.field_key === "species")?.value || SPECIES[0];
    const isCustomSpecies = !SPECIES.includes(rawSpecies);
    setForm({
      name: oc.name,
      species: isCustomSpecies ? "Other" : rawSpecies,
      speciesCustom: isCustomSpecies ? rawSpecies : "",
      gender: oc.fields.find((f) => f.field_key === "gender")?.value || GENDERS[0],
      genderCustom: "",
      sexualOrientation:
        oc.fields.find((f) => f.field_key === "sexual_orientation")?.value || ORIENTATIONS[0],
      sexualCustom: "",
      romanticOrientation:
        oc.fields.find((f) => f.field_key === "romantic_orientation")?.value || ORIENTATIONS[0],
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
      galleryImages: (oc.images ?? []).map((path) => ({
        preview: getPublicImageUrl(path),
        path,
        file: null,
      })),
      fieldVisibility: { ...DEFAULT_VISIBILITY },
      skippedFields: { ...DEFAULT_SKIPPED },
      badges: [],
      isHidden: false,
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
      speciesCustom: "",
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

  function randomizeField(fieldKey: string) {
    const random = generateRandomOC();
    switch (fieldKey) {
      case "name":
        update("name", random.name);
        break;
      case "species":
        update("species", random.species);
        update("speciesCustom", "");
        break;
      case "gender":
        update("gender", random.gender);
        update("genderCustom", "");
        break;
      case "sexual_orientation":
        update("sexualOrientation", random.sexualOrientation);
        update("sexualCustom", "");
        break;
      case "romantic_orientation":
        update("romanticOrientation", random.romanticOrientation);
        update("romanticCustom", "");
        break;
      case "age":
        update("age", String(random.age));
        break;
      case "height_inches":
        update("heightInches", random.heightInches);
        break;
      case "personality":
        update("personality", random.personality);
        break;
      case "tags":
        update("tags", random.tags);
        break;
      case "likes":
        update("likes", random.likes);
        break;
      case "dislikes":
        update("dislikes", random.dislikes);
        break;
      case "appearance":
        update("appearance", random.appearance);
        break;
      case "occupation":
        update("occupation", random.occupation);
        break;
      case "homeworld":
        update("homeworld", random.homeworld);
        break;
      case "backstory":
        update("backstory", random.backstory);
        break;
      case "truth1":
        update("truth1", random.truths[0]);
        break;
      case "truth2":
        update("truth2", random.truths[1]);
        break;
      case "lie":
        update("lie", random.lie);
        break;
      case "openFeed":
        update("openFeed", random.openFeed);
        break;
    }
  }

  function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setForm((prev) => ({ ...prev, imageUrl: url, imageFile: file }));
  }

  function handleGalleryUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Gallery image must be less than 2MB");
      return;
    }
    setForm((prev) => {
      if (prev.galleryImages.length >= 3) {
        toast.error("You can only add up to 3 gallery images");
        return prev;
      }
      return {
        ...prev,
        galleryImages: [
          ...prev.galleryImages,
          { preview: URL.createObjectURL(file), path: null, file },
        ],
      };
    });
  }

  function removeGalleryImage(index: number) {
    setForm((prev) => ({
      ...prev,
      galleryImages: prev.galleryImages.filter((_, i) => i !== index),
    }));
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
      skipped: form.skippedFields[key] ?? false,
    };
  }

  interface FieldHeaderProps {
    label: string;
    fieldKey: string;
    showRandomize?: boolean;
    showSkip?: boolean;
    showVisibility?: boolean;
  }

  function renderFieldHeader({ label, fieldKey, showRandomize = true, showSkip = true, showVisibility = true }: FieldHeaderProps): ReactNode {
    const skipped = form.skippedFields[fieldKey] ?? false;
    const visible = form.fieldVisibility[fieldKey] ?? true;
    return (
      <div className="flex items-center justify-between gap-2">
        <Label className={skipped ? "text-muted-foreground line-through" : undefined}>{label}</Label>
        <div className="flex items-center gap-0.5">
          {showRandomize && (
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              onClick={() => randomizeField(fieldKey)}
              aria-label={`Randomize ${label}`}
            >
              <Dices className="size-3.5 text-muted-foreground transition-colors hover:text-primary" />
            </Button>
          )}
          {showSkip && (
            <label className="flex cursor-pointer items-center gap-1 rounded-md px-1.5 py-1 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted">
              <input
                type="checkbox"
                className="size-3 accent-primary"
                checked={skipped}
                onChange={(e) => updateSkipped(fieldKey, e.target.checked)}
              />
              Skip
            </label>
          )}
          {showVisibility && (
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              onClick={() => updateVisibility(fieldKey, !visible)}
              aria-label={visible ? `Hide ${label}` : `Show ${label}`}
            >
              {visible ? (
                <Eye className="size-3.5 text-muted-foreground transition-colors hover:text-primary" />
              ) : (
                <EyeOff className="size-3.5 text-primary" />
              )}
            </Button>
          )}
        </div>
      </div>
    );
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

      const galleryPaths: string[] = [];
      if (!isGuest) {
        for (const item of form.galleryImages) {
          if (item.file) {
            galleryPaths.push(await uploadImage(item.file));
          } else if (item.path) {
            galleryPaths.push(item.path);
          }
        }
      }

      const genderValue = form.gender === "Other" ? form.genderCustom || "Other" : form.gender;
      const speciesValue = form.species === "Other" ? form.speciesCustom || "Other" : form.species;
      const sexualValue =
        form.sexualOrientation === "Other" ? form.sexualCustom || "Other" : form.sexualOrientation;
      const romanticValue =
        form.romanticOrientation === "Other" ? form.romanticCustom || "Other" : form.romanticOrientation;

      const fields: Omit<TablesInsert<"oc_fields">, "id" | "oc_id">[] = [
        makeField("species", "Species", speciesValue, "select"),
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

      const truthsAndLie = [
        form.skippedFields.truth1 ? "" : form.truth1,
        form.skippedFields.truth2 ? "" : form.truth2,
        form.skippedFields.lie ? "" : form.lie,
      ].filter(Boolean);

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
          tags: form.skippedFields.tags ? [] : form.tags,
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
        tags: form.skippedFields.tags ? [] : form.tags,
        truths_and_lie: truthsAndLie,
        image_url: imagePath,
        images: galleryPaths.length ? galleryPaths : null,
        is_swipable: true,
        is_premade: false,
        is_hidden: form.isHidden,
      };

      const feedData: Omit<TablesInsert<"oc_open_feed">, "id" | "oc_id"> = {
        content: form.openFeed,
        visible: !form.skippedFields.openFeed && form.fieldVisibility.openFeed !== false,
      };

      if (editId) {
        await updateOC({
          ocId: editId,
          oc: { ...ocData, id: editId },
          fields,
          feed: feedData,
        });
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
        <main className="flex flex-1 items-center justify-center pt-20 md:pt-24">Loading...</main>
      </>
    );
  }

  return (
    <>
      <DashboardHeader />
      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-4 py-6 pt-20 md:pt-24">
        <div className="flex items-center justify-between gap-2">
          <h1 className="text-xl font-bold sm:text-2xl">{editId ? "Edit OC" : "Create OC"}</h1>
          <Button variant="outline" onClick={handleRandomize} className="gap-1.5">
            <Dices className="size-4" />
            <span className="hidden sm:inline">Random</span>
            <span className="sm:hidden">Roll</span>
          </Button>
        </div>

        <div className="flex items-center justify-between rounded-lg bg-muted p-1">
          {STEPS.map((s, index) => {
            const Icon = s.icon;
            const active = index === step;
            const completed = index < step;
            return (
              <Fragment key={s.label}>
                {index > 0 && <div className="h-5 w-px bg-border" />}
                <button
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
              </Fragment>
            );
          })}
        </div>

        <div className="rounded-2xl border border-border bg-card p-4 ring-1 ring-foreground/10 sm:p-6">
          {step === 0 && (
            <div className="flex flex-col gap-4">
              <h2 className="text-lg font-semibold">Basic Info</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="flex flex-col gap-1.5 sm:col-span-2">
                  {renderFieldHeader({ label: "Name", fieldKey: "name", showRandomize: true, showSkip: false, showVisibility: false })}
                  <Input
                    id="name"
                    value={form.name}
                    onChange={(e) => update("name", e.target.value)}
                    placeholder="Character name"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  {renderFieldHeader({ label: "Species", fieldKey: "species" })}
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
                  {form.species === "Other" && (
                    <Input
                      value={form.speciesCustom}
                      onChange={(e) => update("speciesCustom", e.target.value)}
                      placeholder="Specify species"
                      className="mt-1"
                    />
                  )}
                </div>
                <div className="flex flex-col gap-1.5">
                  {renderFieldHeader({ label: "Gender", fieldKey: "gender" })}
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
                  {renderFieldHeader({ label: "Sexual Orientation", fieldKey: "sexual_orientation" })}
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
                  {renderFieldHeader({ label: "Romantic Orientation", fieldKey: "romantic_orientation" })}
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
                  {renderFieldHeader({ label: "Age", fieldKey: "age" })}
                  <Input
                    id="age"
                    value={form.age}
                    onChange={(e) => update("age", e.target.value)}
                    placeholder="25"
                  />
                </div>
                <div className="flex flex-col gap-1.5 sm:col-span-2">
                  {renderFieldHeader({ label: "Height", fieldKey: "height_inches" })}
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

              <div className="flex items-center justify-between rounded-lg border border-white/10 bg-white/[0.02] p-3">
                <div className="flex flex-col gap-0.5">
                  <Label className="text-sm font-medium">Hide from swiping</Label>
                  <p className="text-xs text-muted-foreground">This character won&apos;t appear in the swipe stack for others.</p>
                </div>
                <Switch
                  checked={form.isHidden}
                  onCheckedChange={(checked) => update("isHidden", checked)}
                />
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="flex flex-col gap-4">
              <h2 className="text-lg font-semibold">Personality</h2>
              <div className="flex flex-col gap-1.5">
                {renderFieldHeader({ label: "Personality Description", fieldKey: "personality" })}
                <Textarea
                  id="personality"
                  value={form.personality}
                  onChange={(e) => update("personality", e.target.value)}
                  placeholder="What makes them tick?"
                  rows={4}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                {renderFieldHeader({ label: "Tags", fieldKey: "tags" })}
                <TagInput
                  tags={form.tags}
                  onChange={(tags) => update("tags", tags)}
                  suggestions={RANDOM_TRAITS}
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="flex flex-col gap-1.5">
                  {renderFieldHeader({ label: "Likes", fieldKey: "likes" })}
                  <Input
                    id="likes"
                    value={form.likes}
                    onChange={(e) => update("likes", e.target.value)}
                    placeholder="Comma separated"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  {renderFieldHeader({ label: "Dislikes", fieldKey: "dislikes" })}
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
                {renderFieldHeader({ label: "Appearance Description", fieldKey: "appearance" })}
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
                  {renderFieldHeader({ label: "Occupation", fieldKey: "occupation" })}
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
                  {renderFieldHeader({ label: "Homeworld", fieldKey: "homeworld" })}
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
                {renderFieldHeader({ label: "Backstory", fieldKey: "backstory" })}
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
                {renderFieldHeader({ label: "Truth #1", fieldKey: "truth1" })}
                <Input
                  id="truth1"
                  value={form.truth1}
                  onChange={(e) => update("truth1", e.target.value)}
                  placeholder="Something true"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                {renderFieldHeader({ label: "Truth #2", fieldKey: "truth2" })}
                <Input
                  id="truth2"
                  value={form.truth2}
                  onChange={(e) => update("truth2", e.target.value)}
                  placeholder="Something else true"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                {renderFieldHeader({ label: "Lie", fieldKey: "lie" })}
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
                {renderFieldHeader({ label: "Feed Content", fieldKey: "openFeed" })}
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
            <div className="flex flex-col gap-6">
              <h2 className="text-lg font-semibold">Profile Image & Badges</h2>

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

              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <Label>Gallery Images</Label>
                  <span className="text-xs text-muted-foreground">
                    {form.galleryImages.length}/3 (max 2MB each)
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  {form.galleryImages.map((item, index) => (
                    <div
                      key={index}
                      className="relative aspect-square overflow-hidden rounded-xl border border-border bg-muted"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={item.preview}
                        alt={`Gallery ${index + 1}`}
                        className="size-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => removeGalleryImage(index)}
                        className="absolute top-1 right-1 flex size-6 items-center justify-center rounded-full bg-black/60 text-white transition-colors hover:bg-destructive"
                        aria-label={`Remove gallery image ${index + 1}`}
                      >
                        <X className="size-3.5" />
                      </button>
                    </div>
                  ))}
                  {form.galleryImages.length < 3 && (
                    <Label
                      htmlFor="gallery-upload"
                      className="flex aspect-square cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border bg-muted text-muted-foreground transition-colors hover:border-primary hover:text-primary"
                    >
                      <Upload className="size-6" />
                      <span className="text-xs">Add Image</span>
                    </Label>
                  )}
                </div>
                <input
                  id="gallery-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleGalleryUpload}
                  className="sr-only"
                />
              </div>

              <div className="flex flex-col gap-2">
                <Label>Badges</Label>
                <BadgeSelector selected={form.badges} onChange={(badges) => update("badges", badges)} />
              </div>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
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

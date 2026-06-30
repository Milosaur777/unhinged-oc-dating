import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function inchesToFtIn(totalInches: number): string {
  const ft = Math.floor(totalInches / 12);
  const inches = totalInches % 12;
  return `${ft}'${inches}"`;
}

export function inchesToCm(totalInches: number): number {
  return Math.round(totalInches * 2.54);
}

export function cmToInches(cm: number): number {
  return Math.round(cm / 2.54);
}

export function parseHeightInput(input: string): number {
  const cleaned = input.trim().toLowerCase();
  if (cleaned.includes("cm")) {
    const cm = parseFloat(cleaned.replace(/cm/, ""));
    if (!isNaN(cm)) return cmToInches(cm);
  }
  const ftInMatch = cleaned.match(/(\d+)'\s*(\d*)/);
  if (ftInMatch) {
    const ft = parseInt(ftInMatch[1], 10);
    const inches = parseInt(ftInMatch[2] || "0", 10);
    return ft * 12 + inches;
  }
  const num = parseFloat(cleaned);
  if (!isNaN(num)) return Math.round(num);
  return 0;
}

export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(date));
}

export function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function getPublicImageUrl(path: string | null | undefined): string {
  if (!path) return "";
  if (path.startsWith("http") || path.startsWith("/")) return path;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  return `${supabaseUrl}/storage/v1/object/public/oc-images/${path}`;
}

export function generateId(): string {
  return crypto.randomUUID();
}

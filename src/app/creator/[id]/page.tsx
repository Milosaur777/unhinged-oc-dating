import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase-server";
import { CreatorProfileView } from "./CreatorProfileView";
import { ArrowLeft } from "lucide-react";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function CreatorProfilePage({ params }: PageProps) {
  const { id } = await params;

  const supabase = await createClient();
  const { data: profile, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !profile) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-4 px-4 text-center">
        <p className="text-lg font-semibold">Creator not found</p>
        <p className="text-sm text-muted-foreground">This creator hasn&apos;t set up their profile yet.</p>
        <Link href="/swipe" className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mt-4">
          <ArrowLeft className="size-4" />
          Back to swiping
        </Link>
      </main>
    );
  }

  const { data: ocs } = await supabase
    .from("ocs")
    .select("*, fields:oc_fields(*)")
    .eq("user_id", id)
    .eq("is_hidden", false)
    .order("created_at", { ascending: false });

  return <CreatorProfileView profile={profile} ocs={ocs ?? []} />;
}

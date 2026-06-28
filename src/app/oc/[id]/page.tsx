import { Suspense } from "react";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase-server";
import { OCProfile } from "./OCProfile";
import { OCWithDetails, OCField, OCOpenFeed } from "@/lib/supabase-queries";

interface PageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ card?: string; oc?: string }>;
}

export default async function OCPage({ params, searchParams }: PageProps) {
  const { id } = await params;
  const { card, oc: fromOc } = await searchParams;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("ocs")
    .select("*, fields:oc_fields(*), feed:oc_open_feed(*)")
    .eq("id", id)
    .single();

  if (error || !data) {
    notFound();
  }

  const oc: OCWithDetails = {
    ...data,
    fields: ((data.fields as unknown) ?? []) as OCField[],
    feed: ((data.feed as unknown) ?? []) as OCOpenFeed[],
  };

  const {
    data: { user },
  } = await supabase.auth.getUser();
  const isOwner = user?.id === oc.user_id;

  return (
    <Suspense fallback={<div className="p-8 text-center">Loading...</div>}>
      <OCProfile oc={oc} isOwner={isOwner} backToSwipe={card} fromOc={fromOc} />
    </Suspense>
  );
}

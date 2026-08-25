import { notFound } from "next/navigation";
import { requireCoach } from "@/lib/queries/auth";
import { getProgramDetail } from "@/lib/queries/programs";
import { createClient } from "@/lib/supabase/server";
import { ProgramBuilder } from "@/components/coach/program-builder";

export default async function ProgramDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const coach = await requireCoach();
  const detail = await getProgramDetail(coach.id, id);
  if (!detail) notFound();

  const supabase = await createClient();
  const { data: subs } = await supabase
    .from("subscriptions")
    .select("client_id, profiles(full_name)")
    .eq("coach_id", coach.id)
    .in("status", ["active", "trialing"]);

  const clients = (subs ?? [])
    .filter((s) => s.profiles)
    .map((s) => ({ id: s.client_id, name: s.profiles!.full_name }));

  return <ProgramBuilder detail={detail} clients={clients} />;
}

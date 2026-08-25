import { createClient } from "@/lib/supabase/server";

export async function getProgramsForCoach(coachId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("programs")
    .select("id, name, duration_weeks, is_template, client_id, profiles(full_name)")
    .eq("coach_id", coachId)
    .order("created_at", { ascending: false });
  return data ?? [];
}

export async function getProgramDetail(coachId: string, programId: string) {
  const supabase = await createClient();

  const { data: program } = await supabase
    .from("programs")
    .select("*, profiles(full_name)")
    .eq("id", programId)
    .eq("coach_id", coachId)
    .maybeSingle();
  if (!program) return null;

  const { data: days } = await supabase
    .from("program_days")
    .select("*, program_exercises(*, exercises(name))")
    .eq("program_id", programId)
    .order("week_number")
    .order("day_number");

  const { data: exerciseLibrary } = await supabase
    .from("exercises")
    .select("id, name, muscle_group")
    .order("name");

  return {
    program,
    days: (days ?? []).map((d) => ({
      ...d,
      program_exercises: [...d.program_exercises].sort((a, b) => a.order_index - b.order_index),
    })),
    exerciseLibrary: exerciseLibrary ?? [],
  };
}

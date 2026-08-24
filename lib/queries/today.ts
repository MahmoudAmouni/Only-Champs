import { createClient } from "@/lib/supabase/server";

export async function getAssignedProgram(clientId: string) {
  const supabase = await createClient();

  const { data: program } = await supabase
    .from("programs")
    .select("id, name")
    .eq("client_id", clientId)
    .maybeSingle();
  if (!program) return null;

  const { data: days } = await supabase
    .from("program_days")
    .select("*, program_exercises(*, exercises(name, muscle_group))")
    .eq("program_id", program.id)
    .order("week_number")
    .order("day_number");

  return {
    program,
    days: (days ?? []).map((d) => ({
      ...d,
      program_exercises: [...d.program_exercises].sort((a, b) => a.order_index - b.order_index),
    })),
  };
}

/** Most recent weight/reps logged per exercise, regardless of which
 * workout it came from — what the set inputs prefill with. */
export async function getLastSetValues(clientId: string) {
  const supabase = await createClient();

  const { data } = await supabase
    .from("set_logs")
    .select("exercise_id, weight_kg, reps, workout_logs!inner(client_id, started_at)")
    .eq("workout_logs.client_id", clientId)
    .order("started_at", { foreignTable: "workout_logs", ascending: false })
    .limit(200);

  const lastByExercise = new Map<string, { weight_kg: number | null; reps: number | null }>();
  for (const row of data ?? []) {
    if (!lastByExercise.has(row.exercise_id)) {
      lastByExercise.set(row.exercise_id, { weight_kg: row.weight_kg, reps: row.reps });
    }
  }
  return lastByExercise;
}

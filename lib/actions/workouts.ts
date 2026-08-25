"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/queries/auth";

export async function startWorkout(programDayId: string) {
  const user = await requireUser();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("workout_logs")
    .insert({ client_id: user.id, program_day_id: programDayId })
    .select("id")
    .single();
  if (error || !data) throw new Error("Could not start workout.");
  return data.id;
}

/**
 * No unique constraint exists on (workout_log_id, program_exercise_id,
 * set_number) to drive a native ON CONFLICT upsert, so this does the
 * select-then-update-or-insert by hand instead of adding a migration for
 * one narrow case.
 */
export async function logSet(input: {
  workoutLogId: string;
  programExerciseId: string;
  exerciseId: string;
  setNumber: number;
  weightKg: number | null;
  reps: number | null;
  completed: boolean;
}) {
  await requireUser();
  const supabase = await createClient();

  const { data: existing } = await supabase
    .from("set_logs")
    .select("id")
    .eq("workout_log_id", input.workoutLogId)
    .eq("program_exercise_id", input.programExerciseId)
    .eq("set_number", input.setNumber)
    .maybeSingle();

  const row = {
    workout_log_id: input.workoutLogId,
    program_exercise_id: input.programExerciseId,
    exercise_id: input.exerciseId,
    set_number: input.setNumber,
    weight_kg: input.weightKg,
    reps: input.reps,
    completed: input.completed,
  };

  const { error } = existing
    ? await supabase.from("set_logs").update(row).eq("id", existing.id)
    : await supabase.from("set_logs").insert(row);

  if (error) throw new Error("Could not save set.");
}

export async function completeWorkout(workoutLogId: string) {
  const user = await requireUser();
  const supabase = await createClient();
  const { error } = await supabase
    .from("workout_logs")
    .update({ completed_at: new Date().toISOString() })
    .eq("id", workoutLogId)
    .eq("client_id", user.id);
  if (error) throw new Error("Could not finish workout.");

  revalidatePath("/today");
  revalidatePath("/progress");
}

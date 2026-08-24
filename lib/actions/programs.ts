"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireCoach } from "@/lib/queries/auth";

export async function createProgram(_prev: { error?: string } | null, formData: FormData) {
  const coach = await requireCoach();
  const name = String(formData.get("name") ?? "").trim();
  const clientId = String(formData.get("clientId") ?? "") || null;
  const durationWeeks = Number(formData.get("durationWeeks") ?? 4);

  if (!name) return { error: "Name is required." };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("programs")
    .insert({
      coach_id: coach.id,
      name,
      client_id: clientId,
      duration_weeks: durationWeeks,
      is_template: !clientId,
      min_tier_level: 3,
    })
    .select("id")
    .single();

  if (error || !data) return { error: "Could not create program." };

  revalidatePath("/programs");
  return { error: undefined, programId: data.id };
}

export async function assignProgram(programId: string, clientId: string) {
  const coach = await requireCoach();
  const supabase = await createClient();
  const { error } = await supabase
    .from("programs")
    .update({ client_id: clientId, is_template: false })
    .eq("id", programId)
    .eq("coach_id", coach.id);
  if (error) throw new Error("Could not assign program.");
  revalidatePath("/programs");
  revalidatePath(`/programs/${programId}`);
}

export async function addProgramDay(programId: string, weekNumber: number, dayNumber: number, name: string) {
  const coach = await requireCoach();
  const supabase = await createClient();

  const { data: program } = await supabase
    .from("programs")
    .select("id")
    .eq("id", programId)
    .eq("coach_id", coach.id)
    .maybeSingle();
  if (!program) throw new Error("Program not found.");

  const { error } = await supabase.from("program_days").insert({
    program_id: programId,
    week_number: weekNumber,
    day_number: dayNumber,
    name: name || "Training Day",
  });
  if (error) throw new Error("Could not add day.");
  revalidatePath(`/programs/${programId}`);
}

export async function deleteProgramDay(dayId: string, programId: string) {
  await requireCoach();
  const supabase = await createClient();
  const { error } = await supabase.from("program_days").delete().eq("id", dayId);
  if (error) throw new Error("Could not delete day.");
  revalidatePath(`/programs/${programId}`);
}

const ExerciseSchema = z.object({
  exerciseId: z.string().uuid(),
  targetSets: z.coerce.number().int().min(1).max(20),
  targetReps: z.string().min(1).max(20),
  targetRpe: z.coerce.number().min(1).max(10).optional(),
  restSeconds: z.coerce.number().int().min(0).max(600).optional(),
});

export async function addExerciseToDay(
  dayId: string,
  programId: string,
  _prev: { error?: string } | null,
  formData: FormData
) {
  await requireCoach();

  // z.coerce.number().optional() does NOT rescue an empty string — FormData
  // includes the key with value "" for an untouched optional input, which
  // coerces to 0 and fails .min(1), even though the field is genuinely
  // optional. Strip empty strings to undefined before parsing.
  const raw = Object.fromEntries(formData);
  if (raw.targetRpe === "") delete raw.targetRpe;
  if (raw.restSeconds === "") delete raw.restSeconds;

  const parsed = ExerciseSchema.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const supabase = await createClient();
  const { count } = await supabase
    .from("program_exercises")
    .select("id", { count: "exact", head: true })
    .eq("program_day_id", dayId);

  const { error } = await supabase.from("program_exercises").insert({
    program_day_id: dayId,
    exercise_id: parsed.data.exerciseId,
    order_index: count ?? 0,
    target_sets: parsed.data.targetSets,
    target_reps: parsed.data.targetReps,
    target_rpe: parsed.data.targetRpe ?? null,
    rest_seconds: parsed.data.restSeconds ?? 90,
  });
  if (error) return { error: "Could not add exercise." };

  revalidatePath(`/programs/${programId}`);
  return { error: undefined, ok: true };
}

export async function removeExerciseFromDay(programExerciseId: string, programId: string) {
  await requireCoach();
  const supabase = await createClient();
  const { error } = await supabase.from("program_exercises").delete().eq("id", programExerciseId);
  if (error) throw new Error("Could not remove exercise.");
  revalidatePath(`/programs/${programId}`);
}

/** Swaps order_index with the adjacent exercise — the simple alternative
 * to full drag-and-drop, per docs/05-BUILD-ORDER.md's own cut list. */
export async function moveExercise(
  programId: string,
  dayId: string,
  exerciseRowId: string,
  direction: "up" | "down"
) {
  await requireCoach();
  const supabase = await createClient();

  const { data: rows } = await supabase
    .from("program_exercises")
    .select("id, order_index")
    .eq("program_day_id", dayId)
    .order("order_index");
  if (!rows) return;

  const idx = rows.findIndex((r) => r.id === exerciseRowId);
  const swapIdx = direction === "up" ? idx - 1 : idx + 1;
  if (idx === -1 || swapIdx < 0 || swapIdx >= rows.length) return;

  const a = rows[idx];
  const b = rows[swapIdx];

  await supabase.from("program_exercises").update({ order_index: b.order_index }).eq("id", a.id);
  await supabase.from("program_exercises").update({ order_index: a.order_index }).eq("id", b.id);

  revalidatePath(`/programs/${programId}`);
}

/** Duplicates every day (and its exercises) from one week into a new week
 * number — the single biggest time-saver for programs that repeat with
 * small progressions. */
export async function copyWeek(programId: string, fromWeek: number, toWeek: number) {
  await requireCoach();
  const supabase = await createClient();

  const { data: days } = await supabase
    .from("program_days")
    .select("id, day_number, name")
    .eq("program_id", programId)
    .eq("week_number", fromWeek);
  if (!days?.length) throw new Error("No days found in that week.");

  for (const day of days) {
    const { data: newDay, error: dayErr } = await supabase
      .from("program_days")
      .insert({ program_id: programId, week_number: toWeek, day_number: day.day_number, name: day.name })
      .select("id")
      .single();
    if (dayErr || !newDay) throw new Error("Could not copy week.");

    const { data: exercises } = await supabase
      .from("program_exercises")
      .select("exercise_id, order_index, target_sets, target_reps, target_rpe, rest_seconds, notes")
      .eq("program_day_id", day.id);

    if (exercises?.length) {
      const { error: exErr } = await supabase.from("program_exercises").insert(
        exercises.map((e) => ({ ...e, program_day_id: newDay.id }))
      );
      if (exErr) throw new Error("Could not copy exercises.");
    }
  }

  revalidatePath(`/programs/${programId}`);
}

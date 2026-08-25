"use client";

import { useState, useTransition } from "react";
import { Check } from "lucide-react";
import { startWorkout, logSet, completeWorkout } from "@/lib/actions/workouts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type ProgramExercise = {
  id: string;
  exercise_id: string;
  order_index: number;
  target_sets: number;
  target_reps: string;
  target_rpe: number | null;
  exercises: { name: string; muscle_group: string | null } | null;
};
type Day = {
  id: string;
  week_number: number;
  day_number: number;
  name: string;
  program_exercises: ProgramExercise[];
};
type LastValue = { weight_kg: number | null; reps: number | null };

export function TodayClient({
  program,
  days,
  lastValues,
}: {
  program: { id: string; name: string };
  days: Day[];
  lastValues: Record<string, LastValue>;
}) {
  const [selectedDay, setSelectedDay] = useState<Day | null>(null);
  const [workoutLogId, setWorkoutLogId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [finished, setFinished] = useState(false);

  if (finished) {
    return (
      <div className="flex flex-col items-center gap-3 py-16 text-center">
        <div className="flex size-14 items-center justify-center rounded-full bg-success/15">
          <Check className="size-7 text-success" />
        </div>
        <p className="text-lg font-semibold text-foreground">Workout complete</p>
        <p className="text-sm text-muted-foreground">Nice work. See you next session.</p>
      </div>
    );
  }

  if (!selectedDay) {
    return (
      <div className="space-y-4">
        <div>
          <h1 className="text-xl font-semibold tracking-[-0.01em] text-foreground">
            {program.name}
          </h1>
          <p className="text-sm text-muted-foreground">Pick a day to start.</p>
        </div>
        <div className="space-y-2">
          {days.map((day) => (
            <button
              key={day.id}
              type="button"
              onClick={() => {
                startTransition(async () => {
                  const logId = await startWorkout(day.id);
                  setWorkoutLogId(logId);
                  setSelectedDay(day);
                });
              }}
              disabled={isPending}
              className="flex w-full items-center justify-between rounded-lg border border-border p-4 text-left transition-colors hover:border-border-strong"
            >
              <div>
                <p className="font-medium text-foreground">
                  Week {day.week_number}, Day {day.day_number} — {day.name}
                </p>
                <p className="text-xs text-muted-foreground">
                  {day.program_exercises.length} exercises
                </p>
              </div>
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold tracking-[-0.01em] text-foreground">
          {selectedDay.name}
        </h1>
        <p className="text-sm text-muted-foreground">
          Week {selectedDay.week_number}, Day {selectedDay.day_number}
        </p>
      </div>

      {selectedDay.program_exercises.map((pe) => (
        <ExerciseLog
          key={pe.id}
          programExercise={pe}
          workoutLogId={workoutLogId!}
          lastValue={lastValues[pe.exercise_id]}
        />
      ))}

      <Button
        className="w-full"
        disabled={isPending}
        onClick={() =>
          startTransition(async () => {
            await completeWorkout(workoutLogId!);
            setFinished(true);
          })
        }
      >
        Finish workout
      </Button>
    </div>
  );
}

function ExerciseLog({
  programExercise,
  workoutLogId,
  lastValue,
}: {
  programExercise: ProgramExercise;
  workoutLogId: string;
  lastValue?: LastValue;
}) {
  const sets = Array.from({ length: programExercise.target_sets }, (_, i) => i + 1);

  return (
    <div className="rounded-lg border border-border p-4">
      <div className="flex items-baseline justify-between">
        <p className="font-medium text-foreground">{programExercise.exercises?.name}</p>
        <span className="font-mono text-xs tabular-nums text-muted-foreground">
          {programExercise.target_sets} × {programExercise.target_reps}
          {programExercise.target_rpe ? ` @ RPE ${programExercise.target_rpe}` : ""}
        </span>
      </div>

      <div className="mt-3 space-y-2">
        {sets.map((setNumber) => (
          <SetRow
            key={setNumber}
            workoutLogId={workoutLogId}
            programExerciseId={programExercise.id}
            exerciseId={programExercise.exercise_id}
            setNumber={setNumber}
            defaultWeight={lastValue?.weight_kg ?? undefined}
            defaultReps={lastValue?.reps ?? undefined}
          />
        ))}
      </div>
    </div>
  );
}

function SetRow({
  workoutLogId,
  programExerciseId,
  exerciseId,
  setNumber,
  defaultWeight,
  defaultReps,
}: {
  workoutLogId: string;
  programExerciseId: string;
  exerciseId: string;
  setNumber: number;
  defaultWeight?: number;
  defaultReps?: number;
}) {
  const [weight, setWeight] = useState(defaultWeight?.toString() ?? "");
  const [reps, setReps] = useState(defaultReps?.toString() ?? "");
  const [done, setDone] = useState(false);
  const [isPending, startTransition] = useTransition();

  function save(completed: boolean) {
    startTransition(async () => {
      await logSet({
        workoutLogId,
        programExerciseId,
        exerciseId,
        setNumber,
        weightKg: weight ? Number(weight) : null,
        reps: reps ? Number(reps) : null,
        completed,
      });
      setDone(completed);
    });
  }

  return (
    <div className="flex items-center gap-2">
      <span className="w-5 shrink-0 font-mono text-xs tabular-nums text-muted-foreground">
        {setNumber}
      </span>
      <Input
        type="number"
        inputMode="decimal"
        placeholder="kg"
        value={weight}
        onChange={(e) => setWeight(e.target.value)}
        className="h-10 w-20 text-center font-mono tabular-nums"
      />
      <Input
        type="number"
        inputMode="numeric"
        placeholder="reps"
        value={reps}
        onChange={(e) => setReps(e.target.value)}
        className="h-10 w-20 text-center font-mono tabular-nums"
      />
      <button
        type="button"
        disabled={isPending}
        onClick={() => save(!done)}
        aria-label="Mark set complete"
        className={cn(
          "ml-auto flex size-11 shrink-0 items-center justify-center rounded-full border transition-colors",
          done ? "border-primary bg-primary text-primary-foreground" : "border-border text-muted-foreground"
        )}
      >
        <Check className="size-5" />
      </button>
    </div>
  );
}

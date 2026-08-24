"use client";

import { useState, useTransition } from "react";
import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";
import {
  addProgramDay,
  addExerciseToDay,
  assignProgram,
  copyWeek,
  deleteProgramDay,
  moveExercise,
  removeExerciseFromDay,
} from "@/lib/actions/programs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

type Exercise = { id: string; name: string; muscle_group: string | null };
type ProgramExercise = {
  id: string;
  order_index: number;
  target_sets: number;
  target_reps: string;
  target_rpe: number | null;
  rest_seconds: number | null;
  exercises: { name: string } | null;
};
type Day = {
  id: string;
  week_number: number;
  day_number: number;
  name: string;
  program_exercises: ProgramExercise[];
};
type Program = {
  id: string;
  name: string;
  duration_weeks: number;
  client_id: string | null;
  profiles: { full_name: string } | null;
};

export function ProgramBuilder({
  detail,
  clients,
}: {
  detail: { program: Program; days: Day[]; exerciseLibrary: Exercise[] };
  clients: { id: string; name: string }[];
}) {
  const { program, days, exerciseLibrary } = detail;
  const weeks = [...new Set(days.map((d) => d.week_number))].sort((a, b) => a - b);
  const [activeWeek, setActiveWeek] = useState(String(weeks[0] ?? 1));
  const [isPending, startTransition] = useTransition();

  const weekDays = days.filter((d) => String(d.week_number) === activeWeek);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-[30px] font-semibold tracking-[-0.02em] text-foreground">
            {program.name}
          </h1>
          <p className="text-sm text-muted-foreground">{program.duration_weeks} weeks</p>
        </div>
        <AssignControl program={program} clients={clients} />
      </div>

      <Tabs value={activeWeek} onValueChange={setActiveWeek}>
        <div className="flex items-center justify-between">
          <TabsList>
            {(weeks.length ? weeks : [1]).map((w) => (
              <TabsTrigger key={w} value={String(w)}>
                Week {w}
              </TabsTrigger>
            ))}
          </TabsList>
          <div className="flex gap-2">
            <AddDayForm programId={program.id} week={Number(activeWeek)} nextDayNumber={weekDays.length + 1} />
            {weeks.length > 0 && (
              <Button
                type="button"
                size="sm"
                variant="secondary"
                disabled={isPending}
                onClick={() =>
                  startTransition(() =>
                    copyWeek(program.id, Number(activeWeek), Math.max(...weeks, 0) + 1)
                  )
                }
              >
                Copy week
              </Button>
            )}
          </div>
        </div>

        <TabsContent value={activeWeek} className="space-y-4 pt-4">
          {!weekDays.length ? (
            <p className="text-sm text-muted-foreground">No days yet. Add one above.</p>
          ) : (
            weekDays
              .sort((a, b) => a.day_number - b.day_number)
              .map((day) => (
                <DayCard key={day.id} day={day} programId={program.id} exerciseLibrary={exerciseLibrary} />
              ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function AssignControl({
  program,
  clients,
}: {
  program: Program;
  clients: { id: string; name: string }[];
}) {
  const [isPending, startTransition] = useTransition();

  if (program.client_id) {
    return (
      <span className="text-sm text-muted-foreground">
        Assigned to <span className="font-medium text-foreground">{program.profiles?.full_name}</span>
      </span>
    );
  }

  return (
    <Select
      disabled={isPending}
      onValueChange={(clientId: string | null) => {
        if (clientId) startTransition(() => assignProgram(program.id, clientId));
      }}
    >
      <SelectTrigger className="w-48">
        <SelectValue placeholder="Assign to client" />
      </SelectTrigger>
      <SelectContent>
        {clients.map((c) => (
          <SelectItem key={c.id} value={c.id}>
            {c.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function AddDayForm({
  programId,
  week,
  nextDayNumber,
}: {
  programId: string;
  week: number;
  nextDayNumber: number;
}) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [isPending, startTransition] = useTransition();

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button size="sm" variant="secondary" />}>
        <Plus className="size-3.5" /> Add day
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add day — week {week}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="dayName">Name</Label>
            <Input
              id="dayName"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Push"
            />
          </div>
          <Button
            disabled={isPending}
            onClick={() =>
              startTransition(async () => {
                await addProgramDay(programId, week, nextDayNumber, name);
                setOpen(false);
                setName("");
              })
            }
          >
            Add day
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function DayCard({
  day,
  programId,
  exerciseLibrary,
}: {
  day: Day;
  programId: string;
  exerciseLibrary: Exercise[];
}) {
  const [isPending, startTransition] = useTransition();

  return (
    <div className="rounded-lg border border-border p-4">
      <div className="flex items-center justify-between">
        <h3 className="font-medium text-foreground">
          Day {day.day_number} — {day.name}
        </h3>
        <Button
          type="button"
          size="icon-sm"
          variant="ghost"
          disabled={isPending}
          onClick={() => startTransition(() => deleteProgramDay(day.id, programId))}
          aria-label="Delete day"
        >
          <Trash2 className="size-3.5" />
        </Button>
      </div>

      <div className="mt-3 space-y-2">
        {day.program_exercises.map((pe, i) => (
          <div
            key={pe.id}
            className="flex items-center justify-between rounded-md border border-border px-3 py-2 text-sm"
          >
            <div>
              <span className="font-medium text-foreground">{pe.exercises?.name}</span>
              <span className="ml-2 font-mono tabular-nums text-muted-foreground">
                {pe.target_sets} × {pe.target_reps}
                {pe.target_rpe ? ` @ RPE ${pe.target_rpe}` : ""}
              </span>
            </div>
            <div className="flex gap-1">
              <Button
                type="button"
                size="icon-sm"
                variant="ghost"
                disabled={isPending || i === 0}
                onClick={() => startTransition(() => moveExercise(programId, day.id, pe.id, "up"))}
                aria-label="Move up"
              >
                <ArrowUp className="size-3.5" />
              </Button>
              <Button
                type="button"
                size="icon-sm"
                variant="ghost"
                disabled={isPending || i === day.program_exercises.length - 1}
                onClick={() => startTransition(() => moveExercise(programId, day.id, pe.id, "down"))}
                aria-label="Move down"
              >
                <ArrowDown className="size-3.5" />
              </Button>
              <Button
                type="button"
                size="icon-sm"
                variant="ghost"
                disabled={isPending}
                onClick={() => startTransition(() => removeExerciseFromDay(pe.id, programId))}
                aria-label="Remove"
              >
                <Trash2 className="size-3.5" />
              </Button>
            </div>
          </div>
        ))}
      </div>

      <AddExerciseForm dayId={day.id} programId={programId} exerciseLibrary={exerciseLibrary} />
    </div>
  );
}

function AddExerciseForm({
  dayId,
  programId,
  exerciseLibrary,
}: {
  dayId: string;
  programId: string;
  exerciseLibrary: Exercise[];
}) {
  const [open, setOpen] = useState(false);

  async function action(_prev: { error?: string } | null, formData: FormData) {
    const result = await addExerciseToDay(dayId, programId, null, formData);
    if (result?.ok) setOpen(false);
    return result;
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button type="button" size="sm" variant="ghost" className="mt-3" />}>
        <Plus className="size-3.5" /> Add exercise
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add exercise</DialogTitle>
        </DialogHeader>
        <ExerciseForm action={action} exerciseLibrary={exerciseLibrary} />
      </DialogContent>
    </Dialog>
  );
}

function ExerciseForm({
  action,
  exerciseLibrary,
}: {
  action: (prev: { error?: string } | null, formData: FormData) => Promise<{ error?: string } | undefined>;
  exerciseLibrary: Exercise[];
}) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <form
      className="space-y-4"
      action={(formData) =>
        startTransition(async () => {
          const result = await action(null, formData);
          setError(result?.error ?? null);
        })
      }
    >
      <div className="space-y-1.5">
        <Label htmlFor="exerciseId">Exercise</Label>
        <Select name="exerciseId">
          <SelectTrigger id="exerciseId">
            <SelectValue placeholder="Choose an exercise" />
          </SelectTrigger>
          <SelectContent>
            {exerciseLibrary.map((e) => (
              <SelectItem key={e.id} value={e.id}>
                {e.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="targetSets">Sets</Label>
          <Input id="targetSets" name="targetSets" type="number" defaultValue={3} min={1} max={20} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="targetReps">Reps</Label>
          <Input id="targetReps" name="targetReps" defaultValue="8-12" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="targetRpe">RPE</Label>
          <Input id="targetRpe" name="targetRpe" type="number" step="0.5" min={1} max={10} />
        </div>
      </div>

      {error && <p className="text-xs text-danger">{error}</p>}

      <Button type="submit" disabled={isPending}>
        {isPending ? "Adding…" : "Add"}
      </Button>
    </form>
  );
}

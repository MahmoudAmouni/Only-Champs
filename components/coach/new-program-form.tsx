"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createProgram } from "@/lib/actions/programs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export function NewProgramForm() {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function submit(formData: FormData) {
    startTransition(async () => {
      const result = await createProgram(null, formData);
      if (result?.error) {
        setError(result.error);
        return;
      }
      setOpen(false);
      if (result?.programId) router.push(`/programs/${result.programId}`);
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button />}>New program</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New program</DialogTitle>
        </DialogHeader>
        <form action={submit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="name">Name</Label>
            <Input id="name" name="name" placeholder="Push Pull Legs — 4 Week" required />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="durationWeeks">Duration (weeks)</Label>
            <Input id="durationWeeks" name="durationWeeks" type="number" defaultValue={4} min={1} max={52} />
          </div>
          {error && <p className="text-xs text-danger">{error}</p>}
          <Button type="submit" disabled={isPending}>
            {isPending ? "Creating…" : "Create"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

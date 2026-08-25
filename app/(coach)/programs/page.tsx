import Link from "next/link";
import { requireCoach } from "@/lib/queries/auth";
import { getProgramsForCoach } from "@/lib/queries/programs";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/shared/empty-state";
import { NewProgramForm } from "@/components/coach/new-program-form";
import { Dumbbell } from "lucide-react";

export default async function ProgramsPage() {
  const coach = await requireCoach();
  const programs = await getProgramsForCoach(coach.id);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-[30px] font-semibold tracking-[-0.02em] text-foreground">
          Programs
        </h1>
        <NewProgramForm />
      </div>

      {!programs.length ? (
        <EmptyState
          icon={Dumbbell}
          title="No programs yet"
          description="Create a program and assign it to a client."
        />
      ) : (
        <div className="stagger grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {programs.map((p) => (
            <Card key={p.id} className="space-y-2 p-4">
              <p className="font-medium text-foreground">{p.name}</p>
              <p className="text-sm text-muted-foreground">
                {p.duration_weeks} weeks ·{" "}
                {p.client_id ? p.profiles?.full_name ?? "Assigned" : "Template"}
              </p>
              <Button size="sm" variant="secondary" render={<Link href={`/programs/${p.id}`} />} nativeButton={false}>
                Open
              </Button>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

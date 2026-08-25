import { requireUser } from "@/lib/queries/auth";
import { getAssignedProgram, getLastSetValues } from "@/lib/queries/today";
import { TodayClient } from "@/components/client/today-client";
import { EmptyState } from "@/components/shared/empty-state";
import { CalendarCheck } from "lucide-react";

export default async function TodayPage() {
  const user = await requireUser();
  const assigned = await getAssignedProgram(user.id);

  if (!assigned) {
    return (
      <EmptyState
        icon={CalendarCheck}
        title="No program yet"
        description="Message your coach to get a training program assigned."
      />
    );
  }

  const lastValues = await getLastSetValues(user.id);
  const lastValuesObj = Object.fromEntries(lastValues);

  return <TodayClient program={assigned.program} days={assigned.days} lastValues={lastValuesObj} />;
}

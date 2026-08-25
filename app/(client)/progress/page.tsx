import { requireUser } from "@/lib/queries/auth";
import { createClient } from "@/lib/supabase/server";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { WeightChart } from "@/components/client/weight-chart";
import { CheckInComposer } from "@/components/client/checkin-composer";
import { EmptyState } from "@/components/shared/empty-state";
import { Image as ImageIcon } from "lucide-react";

function mondayOf(date: Date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  return d.toISOString().slice(0, 10);
}

export default async function ProgressPage() {
  const user = await requireUser();
  const supabase = await createClient();

  const { data: checkIns } = await supabase
    .from("check_ins")
    .select("*")
    .eq("client_id", user.id)
    .order("week_of", { ascending: false });

  const rows = checkIns ?? [];
  const chartData = [...rows]
    .filter((c) => c.weight_kg !== null)
    .reverse()
    .map((c) => ({
      date: new Date(c.week_of).toLocaleDateString(undefined, { month: "short", day: "numeric" }),
      weight: c.weight_kg!,
    }));

  // Check-ins already arrive newest-first, so the photo grid inherits that
  // order — most recent progress at the top, which is what you want to see.
  const photoWeeks = rows
    .filter((c) => c.photo_paths?.length)
    .map((c) => ({
      id: c.id,
      week_of: c.week_of,
      weight_kg: c.weight_kg,
      photos: c.photo_paths!,
    }));

  const thisWeek = mondayOf(new Date());
  const alreadySubmitted = rows.some((c) => c.week_of === thisWeek);

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold tracking-[-0.01em] text-foreground">Progress</h1>

      <Tabs defaultValue="charts">
        <TabsList>
          <TabsTrigger value="charts">Charts</TabsTrigger>
          <TabsTrigger value="photos">Photos</TabsTrigger>
          <TabsTrigger value="checkins">Check-ins</TabsTrigger>
        </TabsList>

        <TabsContent value="charts" className="space-y-4 pt-4">
          <div className="rounded-lg border border-border p-4">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Weight
            </p>
            <WeightChart data={chartData} />
          </div>
        </TabsContent>

        <TabsContent value="photos" className="pt-4">
          {photoWeeks.length === 0 ? (
            <EmptyState
              icon={ImageIcon}
              title="No photos yet"
              description="Progress photos you add to a check-in will show up here."
            />
          ) : (
            <div className="space-y-5">
              {photoWeeks.map((week) => (
                <div key={week.id} className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Week of{" "}
                    {new Date(week.week_of).toLocaleDateString(undefined, {
                      month: "short",
                      day: "numeric",
                    })}
                    {week.weight_kg !== null && (
                      <span className="ml-2 font-mono normal-case tracking-normal text-fg-muted">
                        {week.weight_kg} kg
                      </span>
                    )}
                  </p>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                    {week.photos.map((src, i) => (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        key={src}
                        src={src}
                        alt={`Progress photo ${i + 1}, week of ${week.week_of}`}
                        loading="lazy"
                        className="aspect-[3/4] w-full rounded-lg border border-border object-cover"
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="checkins" className="space-y-4 pt-4">
          <CheckInComposer alreadySubmitted={alreadySubmitted} />

          {rows.map((c) => (
            <div key={c.id} className="space-y-2 rounded-lg border border-border p-4">
              <p className="text-sm font-medium text-foreground">
                Week of{" "}
                {new Date(c.week_of).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
              </p>
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                {c.weight_kg && <span className="font-mono tabular-nums">{c.weight_kg} kg</span>}
                {c.adherence_pct !== null && (
                  <span className="font-mono tabular-nums">{c.adherence_pct}% adherence</span>
                )}
                {c.sleep_hours && <span>{c.sleep_hours}h sleep</span>}
              </div>
              {c.notes && <p className="text-sm text-muted-foreground">{c.notes}</p>}
              {c.coach_reply && (
                <div className="rounded-md bg-accent p-3 text-sm text-foreground">{c.coach_reply}</div>
              )}
            </div>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
}

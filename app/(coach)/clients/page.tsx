import Link from "next/link";
import { requireCoach } from "@/lib/queries/auth";
import { getClientsForCoach } from "@/lib/queries/clients";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { TierBadge } from "@/components/shared/tier-badge";
import { EmptyState } from "@/components/shared/empty-state";
import { Users } from "lucide-react";

function formatCents(cents: number) {
  return `$${(cents / 100).toLocaleString(undefined, { minimumFractionDigits: 0 })}`;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export default async function ClientsPage() {
  const coach = await requireCoach();
  const clients = await getClientsForCoach(coach.id);

  if (!clients.length) {
    return (
      <div className="space-y-6">
        <h1 className="text-[30px] font-semibold tracking-[-0.02em] text-foreground">
          Clients
        </h1>
        <EmptyState
          icon={Users}
          title="No clients yet"
          description="Share your storefront link to start getting subscribers."
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-[30px] font-semibold tracking-[-0.02em] text-foreground">
        Clients
      </h1>

      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-card text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              <th className="px-4 py-3">Client</th>
              <th className="px-4 py-3">Tier</th>
              <th className="px-4 py-3">Joined</th>
              <th className="px-4 py-3">Last active</th>
              <th className="px-4 py-3">Adherence</th>
              <th className="px-4 py-3 text-right">MRR</th>
              <th className="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {clients.map((c) => (
              <tr
                key={c.subscriptionId}
                className="border-b border-border last:border-0 hover:bg-hover"
              >
                <td className="px-4 py-3">
                  <Link href={`/clients/${c.clientId}`} className="flex items-center gap-3">
                    <Avatar className="size-8">
                      <AvatarImage src={c.avatarUrl ?? undefined} alt="" />
                      <AvatarFallback>{c.name[0]}</AvatarFallback>
                    </Avatar>
                    <span className="font-medium text-foreground">{c.name}</span>
                  </Link>
                </td>
                <td className="px-4 py-3">
                  <TierBadge level={c.tierLevel} />
                </td>
                <td className="px-4 py-3 text-muted-foreground">{formatDate(c.joinedAt)}</td>
                <td className={c.atRisk ? "px-4 py-3 text-warning" : "px-4 py-3 text-muted-foreground"}>
                  {c.daysSinceActive === null ? "Never" : `${c.daysSinceActive}d ago`}
                </td>
                <td className="px-4 py-3 font-mono tabular-nums text-foreground">
                  {c.adherencePct === null ? "—" : `${c.adherencePct}%`}
                </td>
                <td className="px-4 py-3 text-right font-mono tabular-nums text-foreground">
                  {formatCents(c.mrrCents)}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-block size-2 rounded-full ${
                      c.status === "active" ? "bg-success" : "bg-muted-foreground"
                    }`}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

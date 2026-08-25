"use client";

import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export function RevenueChart({ data }: { data: { month: string; mrr: number }[] }) {
  const hasData = data.some((d) => d.mrr > 0);
  if (!hasData) {
    return (
      <div className="flex h-56 items-center justify-center text-sm text-muted-foreground">
        No revenue yet.
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={224}>
      <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="revenueFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--oc-volt-500)" stopOpacity={0.18} />
            <stop offset="100%" stopColor="var(--oc-volt-500)" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid vertical={false} stroke="var(--border)" />
        <XAxis dataKey="month" tick={{ fontSize: 11, fill: "var(--text-muted)" }} axisLine={false} tickLine={false} />
        <YAxis
          tickFormatter={(v) => `$${v}`}
          tick={{ fontSize: 11, fill: "var(--text-muted)" }}
          axisLine={false}
          tickLine={false}
          width={48}
        />
        <Tooltip
          formatter={(value) => [`$${Number(value).toLocaleString()}`, "MRR"]}
          contentStyle={{
            background: "var(--elevated)",
            border: "1px solid var(--border)",
            borderRadius: 10,
            fontSize: 12,
          }}
        />
        <Area type="monotone" dataKey="mrr" stroke="var(--oc-volt-500)" strokeWidth={2} fill="url(#revenueFill)" />
      </AreaChart>
    </ResponsiveContainer>
  );
}

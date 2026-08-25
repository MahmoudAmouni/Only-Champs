import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { StatTile } from "@/components/shared/stat-tile";
import { TierBadge } from "@/components/shared/tier-badge";
import { ThemeToggle } from "@/components/theme-toggle";

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-4">
      <h2 className="text-2xl font-semibold tracking-[-0.01em] text-foreground">
        {title}
      </h2>
      {children}
    </section>
  );
}

function Swatch({ name, className }: { name: string; className: string }) {
  return (
    <div className="space-y-1.5">
      <div
        className={`h-16 rounded-md border border-border ${className}`}
      />
      <div className="text-xs text-muted-foreground">{name}</div>
    </div>
  );
}

export default function StyleguidePage() {
  return (
    <div className="mx-auto max-w-5xl space-y-16 px-8 py-12">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-[36px] font-bold leading-[40px] tracking-[-0.02em] text-foreground">
            Styleguide
          </h1>
          <p className="mt-2 max-w-[68ch] text-muted-foreground">
            Every design token and component primitive from{" "}
            <code className="text-sm">docs/03-DESIGN-SYSTEM.md</code>, rendered
            for a visual check in both themes.
          </p>
        </div>
        <ThemeToggle />
      </header>

      <Section title="Neutrals">
        <div className="grid grid-cols-4 gap-4 sm:grid-cols-8">
          <Swatch name="background" className="bg-background" />
          <Swatch name="card" className="bg-card" />
          <Swatch name="popover" className="bg-popover" />
          <Swatch name="secondary" className="bg-secondary" />
          <Swatch name="muted" className="bg-muted" />
          <Swatch name="accent" className="bg-accent" />
          <Swatch name="border" className="bg-border" />
          <Swatch name="input" className="bg-input" />
        </div>
      </Section>

      <Section title="Accent — Volt">
        <div className="grid grid-cols-4 gap-4 sm:grid-cols-8">
          <Swatch name="volt-400" className="bg-volt-400" />
          <Swatch name="volt-500 (primary)" className="bg-volt-500" />
          <Swatch name="volt-600" className="bg-volt-600" />
          <Swatch name="on-volt" className="bg-volt-ink" />
        </div>
      </Section>

      <Section title="Tier colours">
        <div className="grid grid-cols-4 gap-4 sm:grid-cols-8">
          <Swatch name="tier-1 · Content" className="bg-tier-1" />
          <Swatch name="tier-2 · Group" className="bg-tier-2" />
          <Swatch name="tier-3 · 1:1" className="bg-tier-3" />
        </div>
      </Section>

      <Section title="Semantic">
        <div className="grid grid-cols-4 gap-4 sm:grid-cols-8">
          <Swatch name="success" className="bg-success" />
          <Swatch name="warning" className="bg-warning" />
          <Swatch name="danger" className="bg-danger" />
          <Swatch name="info" className="bg-info" />
        </div>
      </Section>

      <Section title="Typography">
        <div className="space-y-3">
          <div className="font-display text-[48px] font-bold leading-[52px] tracking-[-0.03em]">
            Display large — 48/52
          </div>
          <div className="font-display text-[36px] font-bold leading-[40px] tracking-[-0.02em]">
            Display — 36/40
          </div>
          <div className="text-[30px] font-semibold leading-[36px] tracking-[-0.02em]">
            Heading 1 — 30/36
          </div>
          <div className="text-2xl font-semibold leading-8 tracking-[-0.01em]">
            Heading 2 — 24/32
          </div>
          <div className="text-xl font-semibold leading-7 tracking-[-0.01em]">
            Heading 3 — 20/28
          </div>
          <div className="max-w-[68ch] text-lg leading-7">
            Body large — 18/28. Used for post bodies and long-form copy, capped
            at 68 characters per line so paragraphs stay easy to read.
          </div>
          <div className="text-base leading-6">Body — 16/24. The default.</div>
          <div className="text-sm leading-5 text-muted-foreground">
            Small — 14/20. Table cells and secondary copy.
          </div>
          <div className="text-xs font-medium tracking-[0.02em] text-muted-foreground">
            xs — 12/16. Labels, badges, timestamps.
          </div>
          <div className="text-[11px] font-semibold uppercase leading-[14px] tracking-[0.08em] text-muted-foreground">
            Overline — 11/14
          </div>
          <div className="font-mono text-2xl tabular-nums">
            185.4 kg · 8 reps · RPE 8.5
          </div>
        </div>
      </Section>

      <Section title="Buttons">
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <Button variant="default">Publish post</Button>
            <Button variant="secondary">Save draft</Button>
            <Button variant="ghost">Cancel</Button>
            <Button variant="destructive">Cancel subscription</Button>
            <Button variant="outline">Outline</Button>
            <Button variant="link">Link style</Button>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Button size="sm">Small</Button>
            <Button size="default">Default</Button>
            <Button size="lg">Large</Button>
            <Button disabled>Disabled</Button>
          </div>
        </div>
      </Section>

      <Section title="Inputs">
        <div className="grid max-w-md gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="sg-email">Email</Label>
            <Input id="sg-email" placeholder="you@example.com" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="sg-error">Handle</Label>
            <Input id="sg-error" defaultValue="mc" aria-invalid />
            <p className="text-xs text-danger">
              At least 3 characters, lowercase letters and numbers only.
            </p>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="sg-disabled">Disabled</Label>
            <Input id="sg-disabled" disabled placeholder="Not editable" />
          </div>
        </div>
      </Section>

      <Section title="Badges & tier badges">
        <div className="flex flex-wrap items-center gap-3">
          <Badge>Default</Badge>
          <Badge variant="secondary">Secondary</Badge>
          <Badge variant="outline">Outline</Badge>
          <Badge variant="destructive">Past due</Badge>
          <TierBadge level={1} />
          <TierBadge level={2} />
          <TierBadge level={3} />
        </div>
      </Section>

      <Section title="Card">
        <Card className="max-w-sm">
          <CardHeader>
            <CardTitle>Marcus Reyes</CardTitle>
            <CardDescription>Joined 14 Mar · Level 3</CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            9 days since last workout — flagged as at risk.
          </CardContent>
        </Card>
      </Section>

      <Section title="Stat tiles">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <StatTile
            label="Monthly revenue"
            value="$4,280"
            delta={{ value: "12.4% vs last month", direction: "up" }}
          />
          <StatTile
            label="Active clients"
            value="42"
            delta={{ value: "3 new this month", direction: "up" }}
          />
          <StatTile
            label="At risk"
            value="5"
            delta={{ value: "2 vs last week", direction: "up" }}
            invertPolarity
          />
          <StatTile label="Awaiting reply" value="3" />
        </div>
      </Section>
    </div>
  );
}

import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { IncidentCard } from "@/components/incident-card";
import { Button } from "@/components/ui/button";
import { queueIncidents, useAegis } from "@/lib/store";
import type { IncidentKind, Severity } from "@/lib/types";

export const Route = createFileRoute("/queue/")({ component: QueuePage });

const KINDS: Array<IncidentKind | "all"> = ["all", "crash", "vuln", "review"];
const SEVS: Array<Severity | "all"> = ["all", "P0", "P1", "P2", "P3"];

function QueuePage() {
  const incidents = useAegis((s) => s.incidents);
  const [kind, setKind] = useState<(typeof KINDS)[number]>("all");
  const [sev, setSev] = useState<(typeof SEVS)[number]>("all");

  const items = useMemo(() => {
    return queueIncidents(incidents)
      .filter((i) => (kind === "all" ? true : i.kind === kind))
      .filter((i) => (sev === "all" ? true : i.severity === sev))
      .sort((a, b) => {
        const order = { P0: 0, P1: 1, P2: 2, P3: 3, P4: 4 };
        if (order[a.severity] !== order[b.severity]) return order[a.severity] - order[b.severity];
        return +new Date(b.updatedAt) - +new Date(a.updatedAt);
      });
  }, [incidents, kind, sev]);

  return (
    <AppShell title="Approval queue">
      <div className="mx-auto max-w-4xl">
        <div className="mb-6">
          <h2 className="text-xl font-medium tracking-tight">Human in the loop</h2>
          <p className="mt-1 max-w-2xl text-sm text-muted">
            The agent classifies, retrieves similar past issues, and drafts a ticket. Nothing is written to Linear until someone on this desk approves.
          </p>
        </div>

        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <FilterRow label="Kind" value={kind} options={KINDS} onChange={setKind} />
          <FilterRow label="Severity" value={sev} options={SEVS} onChange={setSev} />
        </div>

        {items.length === 0 ? (
          <div className="rounded-xl bg-surface px-6 py-16 text-center shadow-[var(--shadow-border)]">
            <p className="text-sm font-medium">Queue is clear</p>
            <p className="mt-1 text-sm text-muted">
              Ingest a new signal from Sources, or replay a crash spike on Command.
            </p>
          </div>
        ) : (
          <div className="grid gap-3">
            {items.map((i) => (
              <IncidentCard key={i.id} incident={i} />
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}

function FilterRow<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: readonly T[];
  onChange: (v: T) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <span className="mr-1 text-xs text-subtle">{label}</span>
      {options.map((o) => (
        <Button
          key={o}
          size="sm"
          variant={value === o ? "secondary" : "ghost"}
          onClick={() => onChange(o)}
        >
          {o === "all" ? "All" : o}
        </Button>
      ))}
    </div>
  );
}

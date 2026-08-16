import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/app-shell";
import { SeverityBadge } from "@/components/severity-badge";
import { Badge } from "@/components/ui/badge";
import { relTime } from "@/lib/format";
import { useAegis } from "@/lib/store";

export const Route = createFileRoute("/tickets")({ component: TicketsPage });

const STATUS_TONE = {
  backlog: "neutral",
  todo: "info",
  in_progress: "warn",
  done: "ok",
} as const;

function TicketsPage() {
  const tickets = useAegis((s) => s.tickets);

  return (
    <AppShell title="Tickets">
      <div className="mx-auto max-w-5xl">
        <div className="mb-6">
          <h2 className="text-xl font-medium tracking-tight">Filed from Aegis</h2>
          <p className="mt-1 text-sm text-muted">
            Created only after someone on this desk approved. Open a ticket to move it through todo, in progress, and done.
          </p>
        </div>

        <div className="overflow-hidden rounded-xl bg-surface shadow-[var(--shadow-border)]">
          <ul>
            {tickets.map((t) => (
              <li key={t.key} className="border-b border-border last:border-0">
                <Link
                  to="/ticket/$key"
                  params={{ key: t.key }}
                  className="flex flex-col gap-2 px-4 py-3 hover:bg-elevated/50 sm:flex-row sm:items-center"
                >
                  <span className="font-mono text-xs text-subtle sm:w-28">{t.key}</span>
                  <span className="min-w-0 flex-1 text-sm">{t.title}</span>
                  <div className="flex flex-wrap items-center gap-2">
                    <SeverityBadge severity={t.priority} compact />
                    <Badge tone={STATUS_TONE[t.status]}>{t.status.replace("_", " ")}</Badge>
                    <span className="text-xs text-subtle">{t.assignee}</span>
                    <span className="text-xs text-subtle tabular">{relTime(t.createdAt)}</span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </AppShell>
  );
}

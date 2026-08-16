import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowUpRight, Plus, ShieldAlert } from "lucide-react";
import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip as RTooltip,
  XAxis,
} from "recharts";
import { AppShell } from "@/components/layout/app-shell";
import { IncidentCard } from "@/components/incident-card";
import { SeverityBadge } from "@/components/severity-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { APP_LABEL, SOURCE_LABEL, compactNum, relTime } from "@/lib/format";
import { ACCEPT_14D, CRASH_14D, ROLES } from "@/lib/seed";
import { queueIncidents, useAegis } from "@/lib/store";

export const Route = createFileRoute("/")({ component: Overview });

function Overview() {
  const incidents = useAegis((s) => s.incidents);
  const tickets = useAegis((s) => s.tickets);
  const activity = useAegis((s) => s.activity);
  const sources = useAegis((s) => s.sources);
  const evals = useAegis((s) => s.evals);
  const role = useAegis((s) => s.role);
  const injectSpike = useAegis((s) => s.injectSpike);
  const setComposer = useAegis((s) => s.setComposerOpen);
  const agentRunning = useAegis((s) => s.agentRunning);
  const me = ROLES.find((r) => r.id === role)!;

  const queue = queueIncidents(incidents);
  const p0 = incidents.filter((i) => i.severity === "P0" && i.status !== "ticketed" && i.status !== "rejected");
  const accepted = evals.filter((e) => e.humanAccepted === true).length;
  const decided = evals.filter((e) => e.humanAccepted !== null).length;
  const acceptRate = decided ? Math.round((accepted / decided) * 100) : 74;
  const correctSev = evals.filter((e) => e.expectedSeverity === e.predictedSeverity).length;
  const precision = evals.length ? (correctSev / evals.length).toFixed(2) : "0.88";

  return (
    <AppShell title="Command">
      <div className="mx-auto max-w-6xl space-y-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs tracking-wide text-subtle uppercase">{me.title}</p>
            <h2 className="mt-1 text-2xl font-medium tracking-tight sm:text-3xl">
              Welcome, {me.name.split(" ")[0]}.
            </h2>
            <p className="mt-2 max-w-xl text-sm text-muted">
              You are on the NivaPay on-call desk. {queue.length} drafted tickets are waiting for a
              human. The agent cannot file them.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" onClick={() => setComposer(true)}>
              <Plus className="size-4" />
              Paste a signal
            </Button>
            <Button asChild>
              <Link to="/queue">
                Work the queue
                <ArrowUpRight className="size-4" />
              </Link>
            </Button>
          </div>
        </div>

        <section className="grid gap-3 md:grid-cols-3">
          {[
            {
              n: "1",
              t: "A signal arrives",
              d: "Crash, Snyk finding, or store review — from a source, or you paste it.",
            },
            {
              n: "2",
              t: "Agent drafts a ticket",
              d: "Severity, similar past fixes, suggested patch. Write tools stay paused.",
            },
            {
              n: "3",
              t: "You approve it",
              d: "Edit the draft if needed. Approve files Linear under your name.",
            },
          ].map((s) => (
            <Card key={s.n} className="p-4">
              <p className="font-mono text-xs text-subtle">{s.n}</p>
              <p className="mt-2 text-sm font-medium">{s.t}</p>
              <p className="mt-1 text-sm text-muted">{s.d}</p>
            </Card>
          ))}
        </section>

        <div className="flex flex-wrap items-center gap-3 text-sm">
          <Link to="/guide" className="text-muted underline-offset-4 hover:text-fg hover:underline">
            Full walkthrough
          </Link>
          <button
            type="button"
            className="text-muted underline-offset-4 hover:text-fg hover:underline disabled:opacity-40"
            onClick={() => void injectSpike()}
            disabled={Boolean(agentRunning)}
          >
            Replay last crash spike
          </button>
        </div>

        {p0.length > 0 && (
          <div className="flex gap-3 rounded-xl bg-danger-soft p-4 text-sm">
            <ShieldAlert className="mt-0.5 size-4 shrink-0 text-danger" />
            <div>
              <p className="font-medium text-fg">
                {p0.length} critical item{p0.length > 1 ? "s" : ""} still open
              </p>
              <p className="mt-0.5 text-muted">
                {p0.map((i) => i.id).join(" · ")} — blast radius and write actions need a named approver.
              </p>
            </div>
          </div>
        )}

        <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <Kpi label="Awaiting approval" value={String(queue.length)} hint="HITL interrupt" />
          <Kpi label="Open P0" value={String(p0.length)} hint="Write-blocked" danger={p0.length > 0} />
          <Kpi label="Draft → ticket" value="3.4m" hint="p50 last 7d" />
          <Kpi label="Human accept" value={`${acceptRate}%`} hint={`precision ${precision}`} />
        </section>

        <div className="grid gap-4 lg:grid-cols-5">
          <Card className="lg:col-span-3">
            <div className="mb-4 flex items-baseline justify-between">
              <div>
                <h3 className="text-sm font-medium">Crash volume</h3>
                <p className="text-xs text-subtle">NivaPay + NivaBiz · 14 days</p>
              </div>
              <span className="text-xs text-warn">Spike Aug 12 · 4.18.2</span>
            </div>
            <div className="h-44">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={CRASH_14D} margin={{ top: 4, right: 0, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="crashFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--color-fg)" stopOpacity={0.22} />
                      <stop offset="100%" stopColor="var(--color-fg)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="d" hide />
                  <RTooltip
                    contentStyle={{
                      background: "var(--color-elevated)",
                      border: "1px solid var(--color-border)",
                      borderRadius: 10,
                      fontSize: 12,
                      color: "var(--color-fg)",
                    }}
                    formatter={(v) => [String(v), "events"]}
                  />
                  <Area
                    type="monotone"
                    dataKey="n"
                    stroke="var(--color-fg)"
                    strokeWidth={1.5}
                    fill="url(#crashFill)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <Card className="lg:col-span-2">
            <h3 className="text-sm font-medium">Pipeline</h3>
            <p className="mt-0.5 text-xs text-subtle">LangGraph · durable HITL</p>
            <ol className="mt-4 space-y-3">
              {[
                ["Ingest", incidents.length],
                ["Awaiting human", queue.filter((i) => i.status === "awaiting_approval").length],
                ["Tickets open", tickets.filter((t) => t.status !== "done").length],
                ["Closed / rejected", incidents.filter((i) => i.status === "rejected" || i.status === "ticketed").length],
              ].map(([label, n]) => (
                <li key={String(label)} className="flex items-center justify-between text-sm">
                  <span className="text-muted">{label}</span>
                  <span className="tabular">{n}</span>
                </li>
              ))}
            </ol>
            <div className="mt-5 h-20">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={ACCEPT_14D}>
                  <Area type="monotone" dataKey="pct" stroke="var(--color-ok)" strokeWidth={1.5} fill="transparent" />
                </AreaChart>
              </ResponsiveContainer>
              <p className="text-xs text-subtle">Acceptance trend · 14d</p>
            </div>
          </Card>
        </div>

        <div className="grid gap-4 lg:grid-cols-5">
          <div className="space-y-3 lg:col-span-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium">Needs you</h3>
              <Link to="/queue" className="text-xs text-muted hover:text-fg">
                Full queue
              </Link>
            </div>
            <div className="grid gap-3">
              {queue.slice(0, 3).map((i) => (
                <IncidentCard key={i.id} incident={i} />
              ))}
            </div>
          </div>

          <div className="space-y-3 lg:col-span-2">
            <h3 className="text-sm font-medium">Sources</h3>
            <Card className="space-y-3 p-3">
              {sources.map((s) => (
                <div key={s.id} className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm">{s.label}</p>
                    <p className="text-xs text-subtle">
                      {compactNum(s.events24h)} / 24h · {relTime(s.lastPullAt)}
                    </p>
                  </div>
                  <Badge
                    tone={s.status === "healthy" ? "ok" : s.status === "degraded" ? "warn" : "danger"}
                  >
                    {s.status}
                  </Badge>
                </div>
              ))}
            </Card>

            <h3 className="pt-2 text-sm font-medium">Agent activity</h3>
            <Card className="space-y-3 p-3">
              {activity.slice(0, 6).map((a) => (
                <div key={a.id} className="flex gap-2 text-sm">
                  <span
                    className={
                      a.tone === "danger"
                        ? "mt-1.5 size-1.5 shrink-0 rounded-full bg-danger"
                        : a.tone === "ok"
                          ? "mt-1.5 size-1.5 shrink-0 rounded-full bg-ok"
                          : a.tone === "warn"
                            ? "mt-1.5 size-1.5 shrink-0 rounded-full bg-warn"
                            : "mt-1.5 size-1.5 shrink-0 rounded-full bg-subtle"
                    }
                  />
                  <div>
                    <p className="leading-snug">{a.text}</p>
                    <p className="text-xs text-subtle">{relTime(a.ts)}</p>
                  </div>
                </div>
              ))}
            </Card>
          </div>
        </div>

        <section>
          <h3 className="mb-3 text-sm font-medium">Severity mix · last 48h</h3>
          <div className="flex flex-wrap gap-2">
            {(["P0", "P1", "P2", "P3"] as const).map((sev) => {
              const n = incidents.filter((i) => i.severity === sev).length;
              return (
                <div key={sev} className="flex items-center gap-2 rounded-lg bg-surface px-3 py-2 shadow-[var(--shadow-border)]">
                  <SeverityBadge severity={sev} compact />
                  <span className="text-sm tabular">{n}</span>
                </div>
              );
            })}
            <div className="flex items-center gap-2 rounded-lg bg-surface px-3 py-2 text-sm text-muted shadow-[var(--shadow-border)]">
              Apps {APP_LABEL.consumer} · {APP_LABEL.merchant}
            </div>
            <div className="flex items-center gap-2 rounded-lg bg-surface px-3 py-2 text-sm text-muted shadow-[var(--shadow-border)]">
              {SOURCE_LABEL.crashlytics} + {SOURCE_LABEL.snyk} live
            </div>
          </div>
        </section>
      </div>
    </AppShell>
  );
}

function Kpi({
  label,
  value,
  hint,
  danger,
}: {
  label: string;
  value: string;
  hint: string;
  danger?: boolean;
}) {
  return (
    <Card className="p-4">
      <p className="text-xs text-subtle">{label}</p>
      <p className={`mt-2 text-2xl font-medium tracking-tight tabular ${danger ? "text-danger" : ""}`}>
        {value}
      </p>
      <p className="mt-1 text-xs text-muted">{hint}</p>
    </Card>
  );
}

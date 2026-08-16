import { createFileRoute } from "@tanstack/react-router";
import { Area, AreaChart, ResponsiveContainer, Tooltip as RTooltip, XAxis } from "recharts";
import { AppShell } from "@/components/layout/app-shell";
import { SeverityBadge } from "@/components/severity-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ACCEPT_14D } from "@/lib/seed";
import { useAegis } from "@/lib/store";

export const Route = createFileRoute("/evals")({ component: EvalsPage });

function EvalsPage() {
  const evals = useAegis((s) => s.evals);
  const runEvals = useAegis((s) => s.runEvals);
  const evalRunning = useAegis((s) => s.evalRunning);

  const n = evals.length;
  const sevOk = evals.filter((e) => e.expectedSeverity === e.predictedSeverity).length;
  const actOk = evals.filter((e) => e.expectedAction === e.predictedAction).length;
  const decided = evals.filter((e) => e.humanAccepted !== null);
  const accepted = decided.filter((e) => e.humanAccepted).length;
  const lat = evals.filter((e) => e.latencyMs > 0);
  const p50 = lat.length
    ? lat.map((e) => e.latencyMs).sort((a, b) => a - b)[Math.floor(lat.length / 2)]
    : 0;

  return (
    <AppShell title="Evals">
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-xl font-medium tracking-tight">Golden set</h2>
            <p className="mt-1 max-w-xl text-sm text-muted">
              Past crashes and vulns with labeled severity and action. Gate every prompt or retriever change here.
            </p>
          </div>
          <Button onClick={() => void runEvals()} disabled={evalRunning}>
            {evalRunning ? "Running suite" : "Run eval suite"}
          </Button>
        </div>

        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <Card className="p-4">
            <p className="text-xs text-subtle">Severity precision</p>
            <p className="mt-2 text-2xl font-medium tabular">{n ? (sevOk / n).toFixed(2) : "—"}</p>
            <p className="mt-1 text-xs text-muted">target ≥ 0.85</p>
          </Card>
          <Card className="p-4">
            <p className="text-xs text-subtle">Action recall</p>
            <p className="mt-2 text-2xl font-medium tabular">{n ? (actOk / n).toFixed(2) : "—"}</p>
            <p className="mt-1 text-xs text-muted">ticket vs escalate vs ignore</p>
          </Card>
          <Card className="p-4">
            <p className="text-xs text-subtle">Human accept</p>
            <p className="mt-2 text-2xl font-medium tabular">
              {decided.length ? `${Math.round((accepted / decided.length) * 100)}%` : "—"}
            </p>
            <p className="mt-1 text-xs text-muted">
              {accepted}/{decided.length} decided
            </p>
          </Card>
          <Card className="p-4">
            <p className="text-xs text-subtle">p50 graph latency</p>
            <p className="mt-2 text-2xl font-medium tabular">{p50}ms</p>
            <p className="mt-1 text-xs text-muted">target p95 under 4s</p>
          </Card>
        </div>

        <Card>
          <h3 className="text-sm font-medium">Acceptance · 14 days</h3>
          <div className="mt-3 h-36">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={ACCEPT_14D}>
                <XAxis dataKey="d" hide />
                <RTooltip
                  contentStyle={{
                    background: "var(--color-elevated)",
                    border: "1px solid var(--color-border)",
                    borderRadius: 10,
                    fontSize: 12,
                    color: "var(--color-fg)",
                  }}
                />
                <Area type="monotone" dataKey="pct" stroke="var(--color-ok)" strokeWidth={1.5} fill="transparent" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <div className="overflow-hidden rounded-xl bg-surface shadow-[var(--shadow-border)]">
          <div className="hidden grid-cols-12 gap-2 border-b border-border px-4 py-2 text-xs text-subtle lg:grid">
            <span className="col-span-4">Case</span>
            <span className="col-span-2">Expected</span>
            <span className="col-span-2">Predicted</span>
            <span className="col-span-2">Action</span>
            <span className="col-span-1">Human</span>
            <span className="col-span-1">ms</span>
          </div>
          <ul>
            {evals.map((e) => {
              const sevMatch = e.expectedSeverity === e.predictedSeverity;
              const actMatch = e.expectedAction === e.predictedAction;
              return (
                <li
                  key={e.id}
                  className="grid grid-cols-1 gap-2 border-b border-border px-4 py-3 last:border-0 lg:grid-cols-12 lg:items-center"
                >
                  <span className="text-sm lg:col-span-4">{e.name}</span>
                  <span className="lg:col-span-2">
                    <SeverityBadge severity={e.expectedSeverity} compact />
                  </span>
                  <span className="lg:col-span-2">
                    <SeverityBadge severity={e.predictedSeverity} compact />
                  </span>
                  <span className="text-xs text-muted lg:col-span-2">
                    {e.predictedAction}
                    {!actMatch && <span className="text-warn"> ≠ {e.expectedAction}</span>}
                  </span>
                  <span className="lg:col-span-1">
                    {e.humanAccepted === null ? (
                      <Badge>pending</Badge>
                    ) : (
                      <Badge tone={e.humanAccepted ? "ok" : "danger"}>
                        {e.humanAccepted ? "yes" : "no"}
                      </Badge>
                    )}
                  </span>
                  <span className="font-mono text-xs text-subtle tabular lg:col-span-1">
                    {e.latencyMs || "—"}
                    {!sevMatch && <span className="sr-only"> severity mismatch</span>}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </AppShell>
  );
}

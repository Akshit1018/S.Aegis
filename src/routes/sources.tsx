import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { AppShell } from "@/components/layout/app-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { INGEST_POOL } from "@/lib/agent";
import { SOURCE_LABEL, compactNum, relTime } from "@/lib/format";
import { useAegis } from "@/lib/store";

export const Route = createFileRoute("/sources")({ component: SourcesPage });

function SourcesPage() {
  const sources = useAegis((s) => s.sources);
  const ingest = useAegis((s) => s.ingest);
  const injectFailure = useAegis((s) => s.injectFailure);
  const recoverSource = useAegis((s) => s.recoverSource);
  const injectSpike = useAegis((s) => s.injectSpike);
  const agentRunning = useAegis((s) => s.agentRunning);
  const sourceFailure = useAegis((s) => s.sourceFailure);
  const resetDemo = useAegis((s) => s.resetDemo);
  const setComposer = useAegis((s) => s.setComposerOpen);
  const navigate = useNavigate();

  async function pull(i: number) {
    const id = await ingest(INGEST_POOL[i]);
    toast.success(`Ingested ${id}`);
    void navigate({ to: "/queue/$incidentId", params: { incidentId: id } });
  }

  return (
    <AppShell title="Sources">
      <div className="mx-auto max-w-5xl space-y-6">
        <div>
          <h2 className="text-xl font-medium tracking-tight">Ingestion</h2>
          <p className="mt-1 max-w-2xl text-sm text-muted">
            Live pulls from Crashlytics, Sentry, Snyk, and the stores. When a source is late, paste the payload from the top bar — that is a first-class path, not a demo trick.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {sources.map((s) => (
            <Card key={s.id} className="flex flex-col">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-medium">{s.label}</p>
                  <p className="mt-0.5 text-xs text-subtle">{SOURCE_LABEL[s.id]}</p>
                </div>
                <Badge tone={s.status === "healthy" ? "ok" : s.status === "degraded" ? "warn" : "danger"}>
                  {s.status}
                </Badge>
              </div>
              <p className="mt-4 text-2xl font-medium tabular">{compactNum(s.events24h)}</p>
              <p className="text-xs text-subtle">events / 24h</p>
              <p className="mt-3 text-xs text-muted">{s.note}</p>
              <p className="mt-1 text-xs text-subtle">Last pull {relTime(s.lastPullAt)}</p>
            </Card>
          ))}
        </div>

        <Card>
          <h3 className="text-sm font-medium">Operator actions</h3>
          <p className="mt-1 text-sm text-muted">
            These simulate the messy customer environment — use them in a walkthrough.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button onClick={() => setComposer(true)}>Paste or upload a file</Button>
            <Button
              variant="secondary"
              disabled={Boolean(agentRunning)}
              onClick={() => void pull(0)}
            >
              Ingest integrity timeout
            </Button>
            <Button
              variant="secondary"
              disabled={Boolean(agentRunning)}
              onClick={() => void pull(1)}
            >
              Ingest insecure random
            </Button>
            <Button
              variant="secondary"
              disabled={Boolean(agentRunning)}
              onClick={() => void pull(2)}
            >
              Ingest settlement reviews
            </Button>
            <Button
              variant="secondary"
              disabled={Boolean(agentRunning)}
              onClick={() => void injectSpike()}
            >
              Replay UPI crash spike
            </Button>
            {sourceFailure ? (
              <Button variant="outline" onClick={recoverSource}>
                Close Play Reviews circuit
              </Button>
            ) : (
              <Button variant="outline" onClick={injectFailure}>
                Inject Play 429
              </Button>
            )}
            <Button variant="ghost" onClick={resetDemo}>
              Reset demo
            </Button>
          </div>
        </Card>
      </div>
    </AppShell>
  );
}

import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { SeverityBadge } from "@/components/severity-badge";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { APP_LABEL, SOURCE_LABEL, compactNum, relTime } from "@/lib/format";
import { useAegis } from "@/lib/store";

export const Route = createFileRoute("/inbox")({ component: InboxPage });

function InboxPage() {
  const incidents = useAegis((s) => s.incidents);
  const setComposer = useAegis((s) => s.setComposerOpen);
  const [q, setQ] = useState("");
  const rows = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return [...incidents]
      .filter((i) =>
        needle
          ? `${i.id} ${i.title} ${i.summary} ${i.raw}`.toLowerCase().includes(needle)
          : true,
      )
      .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
  }, [incidents, q]);

  return (
    <AppShell title="Inbox">
      <div className="mx-auto max-w-5xl">
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-xl font-medium tracking-tight">All ingested signals</h2>
            <p className="mt-1 text-sm text-muted">
              Everything that landed on the desk — webhooks, pastes, and uploads. Open one to see the draft.
            </p>
          </div>
          <Button onClick={() => setComposer(true)}>Paste or upload</Button>
        </div>

        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Filter by id, title, stack…"
          className="mb-4 max-w-md"
        />

        {rows.length === 0 ? (
          <div className="rounded-xl bg-surface px-6 py-16 text-center shadow-[var(--shadow-border)]">
            <p className="text-sm font-medium">No signals match</p>
            <p className="mt-1 text-sm text-muted">Paste a crash log to put work on the desk.</p>
            <Button className="mt-4" onClick={() => setComposer(true)}>
              New signal
            </Button>
          </div>
        ) : (
        <div className="overflow-hidden rounded-xl bg-surface shadow-[var(--shadow-border)]">
          <div className="hidden grid-cols-12 gap-2 border-b border-border px-4 py-2 text-xs text-subtle md:grid">
            <span className="col-span-2">ID</span>
            <span className="col-span-5">Title</span>
            <span className="col-span-2">Source</span>
            <span className="col-span-1">Sev</span>
            <span className="col-span-2">Status</span>
          </div>
          <ul>
            {rows.map((i) => (
              <li key={i.id} className="border-b border-border last:border-0">
                <Link
                  to="/queue/$incidentId"
                  params={{ incidentId: i.id }}
                  className="grid grid-cols-1 gap-2 px-4 py-3 transition-colors hover:bg-elevated/50 md:grid-cols-12 md:items-center"
                >
                  <span className="font-mono text-xs text-subtle md:col-span-2">{i.id}</span>
                  <span className="min-w-0 md:col-span-5">
                    <span className="block truncate text-sm">{i.title}</span>
                    <span className="block text-xs text-subtle">
                      {APP_LABEL[i.app]} · {compactNum(i.affectedUsers)} users · {relTime(i.createdAt)}
                    </span>
                  </span>
                  <span className="text-xs text-muted md:col-span-2">{SOURCE_LABEL[i.source]}</span>
                  <span className="md:col-span-1">
                    <SeverityBadge severity={i.severity} compact />
                  </span>
                  <span className="md:col-span-2">
                    <StatusBadge status={i.status} />
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
        )}
      </div>
    </AppShell>
  );
}

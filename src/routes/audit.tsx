import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { Input } from "@/components/ui/input";
import { relTime } from "@/lib/format";
import { useAegis } from "@/lib/store";

export const Route = createFileRoute("/audit")({ component: AuditPage });

function AuditPage() {
  const audit = useAegis((s) => s.audit);
  const [q, setQ] = useState("");

  const rows = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return audit;
    return audit.filter((a) =>
      `${a.actor} ${a.action} ${a.detail} ${a.incidentId ?? ""}`.toLowerCase().includes(needle),
    );
  }, [audit, q]);

  function exportCsv() {
    const header = "ts,actor,action,incident,detail";
    const body = rows
      .map((a) =>
        [a.ts, a.actor, a.action, a.incidentId ?? "", `"${a.detail.replaceAll('"', '""')}"`].join(","),
      )
      .join("\n");
    const blob = new Blob([`${header}\n${body}`], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const el = document.createElement("a");
    el.href = url;
    el.download = "aegis-audit.csv";
    el.click();
    URL.revokeObjectURL(url);
  }

  return (
    <AppShell title="Audit">
      <div className="mx-auto max-w-5xl">
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-xl font-medium tracking-tight">Immutable log</h2>
            <p className="mt-1 text-sm text-muted">
              Every ingest, draft, approval, and rejection. Required for NivaPay compliance review.
            </p>
          </div>
          <button
            type="button"
            onClick={exportCsv}
            className="h-10 rounded-md px-3 text-sm text-muted hover:bg-elevated hover:text-fg"
          >
            Export CSV
          </button>
        </div>

        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Filter actor, action, incident…"
          className="mb-4 max-w-md"
        />

        <div className="overflow-hidden rounded-xl bg-surface shadow-[var(--shadow-border)]">
          <ul>
            {rows.map((a) => (
              <li
                key={a.id}
                className="grid grid-cols-1 gap-1 border-b border-border px-4 py-3 last:border-0 sm:grid-cols-12 sm:items-baseline"
              >
                <span className="font-mono text-xs text-subtle tabular sm:col-span-3">{relTime(a.ts)}</span>
                <span className="text-sm sm:col-span-2">{a.actor}</span>
                <span className="font-mono text-xs text-muted sm:col-span-2">{a.action}</span>
                <span className="font-mono text-xs text-subtle sm:col-span-1">{a.incidentId ?? "—"}</span>
                <span className="text-sm text-muted sm:col-span-4">{a.detail}</span>
              </li>
            ))}
            {rows.length === 0 && (
              <li className="px-4 py-10 text-center text-sm text-muted">No matching events</li>
            )}
          </ul>
        </div>
      </div>
    </AppShell>
  );
}

import { Link } from "@tanstack/react-router";
import { APP_LABEL, PLATFORM_LABEL, SOURCE_LABEL, compactNum, relTime } from "@/lib/format";
import type { Incident } from "@/lib/types";
import { SeverityBadge } from "./severity-badge";
import { StatusBadge } from "./status-badge";
import { Progress } from "./ui/progress";

export function IncidentCard({ incident: i }: { incident: Incident }) {
  return (
    <Link
      to="/queue/$incidentId"
      params={{ incidentId: i.id }}
      className="block rounded-xl bg-surface p-4 shadow-[var(--shadow-border)] transition-[box-shadow] duration-150 hover:shadow-[var(--shadow-border-hover)]"
    >
      <div className="flex flex-wrap items-center gap-2">
        <SeverityBadge severity={i.severity} />
        <StatusBadge status={i.status} />
        <span className="font-mono text-xs text-subtle">{i.id}</span>
        <span className="ml-auto text-xs text-subtle tabular">{relTime(i.updatedAt)}</span>
      </div>
      <h3 className="mt-3 text-sm font-medium leading-snug text-fg">{i.title}</h3>
      <p className="mt-1.5 line-clamp-2 text-sm text-muted">{i.summary}</p>
      <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-subtle">
        <span>{APP_LABEL[i.app]} {i.appVersion}</span>
        <span>{PLATFORM_LABEL[i.platform]}</span>
        <span>{SOURCE_LABEL[i.source]}</span>
        {i.affectedUsers > 0 && <span className="tabular">{compactNum(i.affectedUsers)} users</span>}
      </div>
      {i.blastRadius > 0 && (
        <div className="mt-3 flex items-center gap-3">
          <Progress
            value={i.blastRadius}
            className="flex-1"
            barClassName={i.severity === "P0" ? "bg-danger" : i.severity === "P1" ? "bg-warn" : "bg-fg"}
          />
          <span className="text-xs text-muted tabular">{i.blastRadius}</span>
        </div>
      )}
    </Link>
  );
}

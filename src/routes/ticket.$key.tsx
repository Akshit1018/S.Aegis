import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { SeverityBadge } from "@/components/severity-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { relTime } from "@/lib/format";
import { useAegis } from "@/lib/store";
import type { Ticket } from "@/lib/types";

export const Route = createFileRoute("/ticket/$key")({ component: TicketDetail });

const NEXT: Record<Ticket["status"], Ticket["status"] | null> = {
  backlog: "todo",
  todo: "in_progress",
  in_progress: "done",
  done: null,
};

function TicketDetail() {
  const { key } = Route.useParams();
  const ticket = useAegis((s) => s.tickets.find((t) => t.key === key));
  const incident = useAegis((s) => s.incidents.find((i) => i.id === ticket?.incidentId));
  const setStatus = useAegis((s) => s.setTicketStatus);

  if (!ticket) {
    return (
      <AppShell title="Ticket">
        <div className="mx-auto max-w-xl py-16 text-center">
          <p className="text-sm">Ticket not found.</p>
          <Button asChild className="mt-4" variant="secondary">
            <Link to="/tickets">All tickets</Link>
          </Button>
        </div>
      </AppShell>
    );
  }

  const next = NEXT[ticket.status];

  return (
    <AppShell title={ticket.key}>
      <div className="mx-auto max-w-3xl">
        <Link to="/tickets" className="mb-4 inline-flex h-10 items-center gap-1.5 text-sm text-muted hover:text-fg">
          <ArrowLeft className="size-4" />
          Tickets
        </Link>
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-mono text-xs text-subtle">{ticket.key}</span>
          <SeverityBadge severity={ticket.priority} compact />
          <Badge tone={ticket.status === "done" ? "ok" : ticket.status === "in_progress" ? "warn" : "info"}>
            {ticket.status.replace("_", " ")}
          </Badge>
        </div>
        <h2 className="mt-3 text-xl font-medium tracking-tight">{ticket.title}</h2>
        <p className="mt-2 text-sm text-muted">
          {ticket.project} · {ticket.assignee} · filed {relTime(ticket.createdAt)}
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          {ticket.labels.map((l) => (
            <Badge key={l}>{l}</Badge>
          ))}
        </div>

        <div className="mt-6 flex flex-wrap gap-2">
          {next && (
            <Button onClick={() => setStatus(ticket.key, next)}>
              Move to {next.replace("_", " ")}
            </Button>
          )}
          {incident && (
            <Button variant="secondary" asChild>
              <Link to="/queue/$incidentId" params={{ incidentId: incident.id }}>
                Open source incident
              </Link>
            </Button>
          )}
        </div>

        {incident && (
          <Card className="mt-6">
            <p className="text-xs text-subtle">From {incident.id}</p>
            <p className="mt-2 text-sm">{incident.summary}</p>
            {incident.suggestedFix && (
              <p className="mt-3 text-sm text-muted">{incident.suggestedFix}</p>
            )}
          </Card>
        )}
      </div>
    </AppShell>
  );
}

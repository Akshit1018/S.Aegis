import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Check, ChevronRight, X } from "lucide-react";
import { toast } from "sonner";
import { AegisMark } from "@/components/mark";
import { SeverityBadge } from "@/components/severity-badge";
import { Button } from "@/components/ui/button";
import { APP_LABEL, compactNum, relTime } from "@/lib/format";
import { ROLES } from "@/lib/seed";
import { queueIncidents, useAegis } from "@/lib/store";

export const Route = createFileRoute("/mobile")({ component: MobileCompanion });

function MobileCompanion() {
  const incidents = useAegis((s) => s.incidents);
  const notes = useAegis((s) => s.notes);
  const role = useAegis((s) => s.role);
  const approve = useAegis((s) => s.approve);
  const reject = useAegis((s) => s.reject);
  const me = ROLES.find((r) => r.id === role)!;
  const queue = queueIncidents(incidents).filter((i) => i.status === "awaiting_approval");
  const unread = notes.filter((n) => !n.read);

  return (
    <div className="min-h-dvh bg-bg text-fg">
      <div className="mx-auto flex min-h-dvh max-w-md flex-col">
        <header className="flex items-center gap-3 px-4 pt-5 pb-3">
          <Link
            to="/"
            className="grid size-10 place-items-center rounded-md text-muted hover:bg-elevated hover:text-fg"
            aria-label="Back to console"
          >
            <ArrowLeft className="size-4" />
          </Link>
          <AegisMark className="size-6" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium">On-call</p>
            <p className="truncate text-xs text-subtle">{me.name}</p>
          </div>
        </header>

        {unread[0] && (
          <div className="mx-4 mb-3 rounded-xl bg-elevated p-3 shadow-[var(--shadow-border)]">
            <p className="text-xs text-subtle">Push</p>
            <p className="mt-0.5 text-sm font-medium">{unread[0].title}</p>
            <p className="text-xs text-muted">{unread[0].body}</p>
          </div>
        )}

        <div className="px-4 pb-2">
          <h1 className="text-xl font-medium tracking-tight">{queue.length} waiting</h1>
          <p className="mt-1 text-sm text-muted">Approve from here. Writes still go through the same HITL path.</p>
        </div>

        <ul className="flex-1 space-y-3 px-4 pb-8">
          {queue.map((i) => (
            <li key={i.id} className="rounded-xl bg-surface p-4 shadow-[var(--shadow-border)]">
              <div className="flex items-center gap-2">
                <SeverityBadge severity={i.severity} compact />
                <span className="font-mono text-xs text-subtle">{i.id}</span>
                <span className="ml-auto text-xs text-subtle">{relTime(i.updatedAt)}</span>
              </div>
              <p className="mt-2 text-sm font-medium leading-snug">{i.title}</p>
              <p className="mt-1 text-xs text-muted">
                {APP_LABEL[i.app]} · {compactNum(i.affectedUsers)} users · {Math.round(i.confidence * 100)}%
              </p>
              {i.draftTicket.title && (
                <p className="mt-2 font-mono text-xs text-subtle">{i.draftTicket.keyPreview}</p>
              )}
              <div className="mt-4 flex gap-2">
                <Button
                  className="h-11 flex-1"
                  onClick={() => {
                    approve(i.id);
                    toast.success(`Created ${i.draftTicket.keyPreview}`);
                  }}
                >
                  <Check className="size-4" />
                  Approve
                </Button>
                <Button
                  variant="outline"
                  className="h-11 flex-1"
                  onClick={() => {
                    reject(i.id, "Rejected from on-call companion");
                    toast("Rejected");
                  }}
                >
                  <X className="size-4" />
                  Reject
                </Button>
              </div>
              <Link
                to="/queue/$incidentId"
                params={{ incidentId: i.id }}
                className="mt-2 flex h-11 items-center justify-center gap-1 text-sm text-muted"
              >
                Full context
                <ChevronRight className="size-4" />
              </Link>
            </li>
          ))}
          {queue.length === 0 && (
            <li className="rounded-xl bg-surface px-4 py-16 text-center text-sm text-muted shadow-[var(--shadow-border)]">
              Nothing waiting. You are clear.
            </li>
          )}
        </ul>
      </div>
    </div>
  );
}

import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, GitBranch, Shield } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { AgentTrace } from "@/components/agent-trace";
import { AppShell } from "@/components/layout/app-shell";
import { SeverityBadge } from "@/components/severity-badge";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { APP_LABEL, PLATFORM_LABEL, SOURCE_LABEL, compactNum, relTime } from "@/lib/format";
import { useAegis } from "@/lib/store";

export const Route = createFileRoute("/queue/$incidentId")({
  component: IncidentDetail,
});

function IncidentDetail() {
  const { incidentId } = Route.useParams();
  const incident = useAegis((s) => s.incidents.find((i) => i.id === incidentId));
  const updateDraft = useAegis((s) => s.updateDraft);
  const approve = useAegis((s) => s.approve);
  const reject = useAegis((s) => s.reject);
  const escalate = useAegis((s) => s.escalate);
  const runAgent = useAegis((s) => s.runAgent);
  const agentRunning = useAegis((s) => s.agentRunning);
  const allComments = useAegis((s) => s.comments);
  const addComment = useAegis((s) => s.addComment);

  const comments = allComments.filter((c) => c.incidentId === incidentId);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [note, setNote] = useState("");

  if (!incident) {
    return (
      <AppShell title="Incident">
        <div className="mx-auto max-w-xl py-20 text-center">
          <p className="text-sm">Incident not found.</p>
          <Button asChild className="mt-4" variant="secondary">
            <Link to="/queue">Back to queue</Link>
          </Button>
        </div>
      </AppShell>
    );
  }

  const i = incident;
  const waiting = i.status === "awaiting_approval" || i.status === "drafted";
  const running = agentRunning === i.id || i.status === "classifying";

  return (
    <AppShell title={i.id}>
      <div className="mx-auto max-w-6xl">
        <Link
          to="/queue"
          className="mb-4 inline-flex h-10 items-center gap-1.5 text-sm text-muted hover:text-fg"
        >
          <ArrowLeft className="size-4" />
          Queue
        </Link>

        <div className="mb-6 flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <SeverityBadge severity={i.severity} />
              <StatusBadge status={i.status} />
              <span className="font-mono text-xs text-subtle">{i.id}</span>
            </div>
            <h2 className="mt-3 text-xl font-medium tracking-tight sm:text-2xl">{i.title}</h2>
            <p className="mt-2 max-w-3xl text-sm text-muted">{i.summary}</p>
            <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-subtle">
              <span>
                {APP_LABEL[i.app]} {i.appVersion}
              </span>
              <span>{PLATFORM_LABEL[i.platform]}</span>
              <span>{SOURCE_LABEL[i.source]}</span>
              {i.affectedUsers > 0 && <span className="tabular">{compactNum(i.affectedUsers)} users</span>}
              {i.occurrences > 0 && <span className="tabular">{compactNum(i.occurrences)} events</span>}
              <span>{relTime(i.createdAt)}</span>
              {i.confidence > 0 && <span className="tabular">{Math.round(i.confidence * 100)}% confidence</span>}
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {(i.status === "ingested" || i.status === "classifying") && (
              <Button onClick={() => void runAgent(i.id)} disabled={running}>
                {running ? "Agent running" : "Run agent"}
              </Button>
            )}
            {waiting && (
              <>
                <Button
                  onClick={() => {
                    approve(i.id);
                    toast.success(`Created ${i.draftTicket.keyPreview}`);
                  }}
                >
                  Approve & create ticket
                </Button>
                <Button variant="secondary" onClick={() => escalate(i.id)}>
                  Escalate
                </Button>
                <Button variant="outline" onClick={() => setRejectOpen(true)}>
                  Reject
                </Button>
              </>
            )}
          </div>
        </div>

        {waiting && (
          <div className="mb-6 flex gap-3 rounded-xl bg-warn-soft p-4 text-sm">
            <Shield className="mt-0.5 size-4 shrink-0 text-warn" />
            <div>
              <p className="font-medium">Write tools are paused</p>
              <p className="text-muted">
                LangGraph hit a human interrupt before create_ticket. Approving will file{" "}
                <span className="font-mono text-fg">{i.draftTicket.keyPreview}</span> as {i.draftTicket.assignee}.
              </p>
            </div>
          </div>
        )}

        {i.status === "ticketed" && (
          <div className="mb-6 rounded-xl bg-ok-soft p-4 text-sm">
            Ticket{" "}
            <Link to="/ticket/$key" params={{ key: i.ticketKey ?? "" }} className="font-mono underline-offset-4 hover:underline">
              {i.ticketKey}
            </Link>{" "}
            created
            {i.approvedBy ? ` by ${i.approvedBy}` : ""}. Push sent to on-call.
          </div>
        )}

        {i.status === "rejected" && (
          <div className="mb-6 rounded-xl bg-elevated p-4 text-sm">
            Rejected. {i.rejectReason}
          </div>
        )}

        <div className="grid gap-4 lg:grid-cols-5">
          <div className="space-y-4 lg:col-span-3">
            <Card>
              <h3 className="text-sm font-medium">Raw signal</h3>
              <pre className="mt-3 max-h-72 overflow-auto rounded-lg bg-inset p-3 font-mono text-xs leading-relaxed text-muted">
                {i.raw}
              </pre>
            </Card>

            {i.suggestedFix && (
              <Card>
                <h3 className="text-sm font-medium">Suggested fix</h3>
                <p className="mt-2 text-sm text-muted">{i.suggestedFix}</p>
                {i.suggestedPatch && (
                  <pre className="mt-3 overflow-auto rounded-lg bg-inset p-3 font-mono text-xs leading-relaxed text-fg">
                    {i.suggestedPatch}
                  </pre>
                )}
              </Card>
            )}

            {i.similarIssues.length > 0 && (
              <Card>
                <div className="mb-3 flex items-center gap-2">
                  <GitBranch className="size-4 text-muted" />
                  <h3 className="text-sm font-medium">Similar past issues</h3>
                </div>
                <ul className="space-y-3">
                  {i.similarIssues.map((s) => (
                    <li key={s.id} className="rounded-lg bg-inset p-3">
                      <div className="flex items-baseline justify-between gap-2">
                        <p className="text-sm font-medium">{s.title}</p>
                        <span className="font-mono text-xs text-subtle tabular">
                          {Math.round(s.similarity * 100)}%
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-muted">{s.resolution}</p>
                      <p className="mt-1 font-mono text-xs text-subtle">{s.ticketKey}</p>
                    </li>
                  ))}
                </ul>
              </Card>
            )}

            {(waiting || i.status === "ticketed") && i.draftTicket.title && (
              <Card>
                <h3 className="text-sm font-medium">Draft ticket</h3>
                <p className="mt-1 text-xs text-subtle">
                  {i.draftTicket.project} · {i.draftTicket.keyPreview} · editable before approve
                </p>
                <div className="mt-4 space-y-3">
                  <label className="block text-xs text-subtle">
                    Title
                    <Input
                      className="mt-1"
                      value={i.draftTicket.title}
                      disabled={!waiting}
                      onChange={(e) => updateDraft(i.id, { title: e.target.value })}
                    />
                  </label>
                  <label className="block text-xs text-subtle">
                    Description
                    <Textarea
                      className="mt-1"
                      value={i.draftTicket.description}
                      disabled={!waiting}
                      onChange={(e) => updateDraft(i.id, { description: e.target.value })}
                    />
                  </label>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <label className="block text-xs text-subtle">
                      Assignee
                      <Input
                        className="mt-1"
                        value={i.draftTicket.assignee}
                        disabled={!waiting}
                        onChange={(e) => updateDraft(i.id, { assignee: e.target.value })}
                      />
                    </label>
                    <label className="block text-xs text-subtle">
                      Labels
                      <Input
                        className="mt-1"
                        value={i.draftTicket.labels.join(", ")}
                        disabled={!waiting}
                        onChange={(e) =>
                          updateDraft(i.id, {
                            labels: e.target.value.split(",").map((x) => x.trim()).filter(Boolean),
                          })
                        }
                      />
                    </label>
                  </div>
                </div>
              </Card>
            )}

            <Card>
              <h3 className="text-sm font-medium">Desk notes</h3>
              <p className="mt-1 text-xs text-subtle">Visible to whoever picks up this incident next.</p>
              <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                <Input
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Add a note…"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && note.trim()) {
                      addComment(i.id, note);
                      setNote("");
                    }
                  }}
                />
                <Button
                  variant="secondary"
                  onClick={() => {
                    addComment(i.id, note);
                    setNote("");
                  }}
                  disabled={!note.trim()}
                >
                  Post
                </Button>
              </div>
              <ul className="mt-4 space-y-3">
                {comments.map((c) => (
                  <li key={c.id}>
                    <p className="text-xs text-subtle">
                      {c.author} · {relTime(c.ts)}
                    </p>
                    <p className="mt-0.5 text-sm">{c.body}</p>
                  </li>
                ))}
                {comments.length === 0 && (
                  <li className="text-sm text-muted">No notes yet.</li>
                )}
              </ul>
            </Card>
          </div>

          <div className="space-y-4 lg:col-span-2">
            <Card>
              <h3 className="mb-4 text-sm font-medium">Agent graph</h3>
              <AgentTrace steps={i.trace} />
            </Card>
            {i.classification && (
              <Card>
                <p className="text-xs text-subtle">Classification</p>
                <p className="mt-1 text-sm">{i.classification}</p>
                <p className="mt-3 text-xs text-subtle">Blast radius</p>
                <p className="mt-1 text-2xl font-medium tabular">{i.blastRadius}</p>
              </Card>
            )}
          </div>
        </div>
      </div>

      <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
        <DialogContent>
          <DialogTitle>Reject draft</DialogTitle>
          <DialogDescription>
            The agent will keep this as a negative label. Nothing is written upstream.
          </DialogDescription>
          <Textarea
            className="mt-4"
            placeholder="Why is this wrong?"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
          <div className="mt-4 flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setRejectOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              disabled={!reason.trim()}
              onClick={() => {
                reject(i.id, reason.trim());
                setRejectOpen(false);
                toast("Draft rejected");
              }}
            >
              Reject
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}

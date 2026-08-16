import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useAegis } from "@/lib/store";

export const Route = createFileRoute("/guide")({ component: GuidePage });

function GuidePage() {
  const setComposer = useAegis((s) => s.setComposerOpen);

  return (
    <AppShell title="How it works">
      <div className="mx-auto max-w-3xl space-y-8">
        <div>
          <p className="text-xs tracking-wide text-subtle uppercase">Use case</p>
          <h2 className="mt-1 text-2xl font-medium tracking-tight">
            A web desk for people who get paged about mobile apps.
          </h2>
          <p className="mt-3 text-sm text-muted">
            NivaPay ships two apps: NivaPay (consumer, Flutter) and NivaBiz (merchant, React Native).
            Crashes, Snyk findings, and angry store reviews arrive faster than a human can file tickets.
            Aegis is the browser console that person opens at the start of a shift. It is not a chatbot
            and it is not allowed to write to Linear without a name on the approval.
          </p>
        </div>

        <ol className="space-y-3">
          {[
            {
              t: "Something breaks in the wild",
              d: "A null-deref ships in 4.18.2. Crashlytics spikes. Or CI posts a Snyk SARIF. Or 40 one-star reviews mention a double debit.",
            },
            {
              t: "The signal hits this desk",
              d: "Webhooks and scheduled pulls land in Inbox. If a source is late, you paste the stack or upload the JSON from the top bar — New signal.",
            },
            {
              t: "The agent runs a fixed graph",
              d: "Ingest → embed → retrieve similar past issues → classify severity → score blast radius → draft a fix and a ticket. Then it stops. That stop is the product.",
            },
            {
              t: "You decide",
              d: "Open Approval queue. Read the raw signal next to the draft. Edit the title. Approve (creates the ticket under your desk role), reject (labels the golden set), or escalate.",
            },
            {
              t: "The ticket is real work",
              d: "Filed tickets live under Tickets. Move them todo → in progress → done. The audit log keeps who approved what, for compliance.",
            },
          ].map((s, i) => (
            <li key={s.t} className="flex gap-4 rounded-xl bg-surface p-4 shadow-[var(--shadow-border)]">
              <span className="font-mono text-sm text-subtle tabular">{i + 1}</span>
              <div>
                <p className="text-sm font-medium">{s.t}</p>
                <p className="mt-1 text-sm text-muted">{s.d}</p>
              </div>
            </li>
          ))}
        </ol>

        <Card>
          <h3 className="text-sm font-medium">Who sits here</h3>
          <ul className="mt-3 space-y-2 text-sm text-muted">
            <li>
              <span className="text-fg">On-call (Priya)</span> — works the P0/P1 queue and approves writes.
            </li>
            <li>
              <span className="text-fg">Eng manager (Arjun)</span> — watches evals, acceptance, escalations.
            </li>
            <li>
              <span className="text-fg">Triage (Kavya)</span> — owns review clusters and support tickets.
            </li>
            <li>
              <span className="text-fg">Operator (Rohan)</span> — sources, injected failures, eval suite.
            </li>
          </ul>
          <p className="mt-4 text-sm text-muted">
            Switch the desk role in the left rail. Approvals are signed as that person. Your session is
            saved in this browser so the queue you worked does not reset on refresh.
          </p>
        </Card>

        <div className="flex flex-wrap gap-2">
          <Button asChild>
            <Link to="/queue">Open the queue</Link>
          </Button>
          <Button variant="secondary" onClick={() => setComposer(true)}>
            Paste a crash or scan
          </Button>
          <Button variant="outline" asChild>
            <Link to="/">Back to command</Link>
          </Button>
        </div>
      </div>
    </AppShell>
  );
}

import { useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { useAegis } from "@/lib/store";

const STEPS = [
  {
    n: "1",
    title: "Signals land on the desk",
    body: "Crashlytics, Sentry, Snyk, and store reviews arrive automatically. You can also paste a stack or upload a file.",
  },
  {
    n: "2",
    title: "The agent drafts — it does not write",
    body: "It classifies severity, finds similar past fixes, and prepares a Linear ticket. Write tools stay blocked.",
  },
  {
    n: "3",
    title: "You approve, edit, or reject",
    body: "Open the queue. Read the draft. Change the title if needed. Approve creates the ticket under your name.",
  },
];

export function Onboarding() {
  const [ready, setReady] = useState(false);
  const hydrated = useAegis((s) => s.hydrated);
  const seen = useAegis((s) => s.seenGuide);
  const dismiss = useAegis((s) => s.dismissGuide);
  const setComposer = useAegis((s) => s.setComposerOpen);
  const navigate = useNavigate();

  useEffect(() => {
    setReady(true);
  }, []);

  if (!ready || !hydrated || seen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-bg/70 p-4 sm:items-center">
      <div className="w-full max-w-lg rounded-2xl bg-surface p-6 shadow-[var(--shadow-border),var(--shadow-lift)]">
        <h2 className="text-lg font-medium">This is the on-call desk</h2>
        <p className="mt-2 text-sm text-muted">
          Aegis is the web console NivaPay’s mobile and security engineers sit in during a shift. It turns messy crash dumps and scanner output into a ticket you can stand behind.
        </p>
        <ol className="mt-5 space-y-4">
          {STEPS.map((s) => (
            <li key={s.n} className="flex gap-3">
              <span className="grid size-7 shrink-0 place-items-center rounded-full bg-elevated font-mono text-xs">
                {s.n}
              </span>
              <div>
                <p className="text-sm font-medium">{s.title}</p>
                <p className="mt-0.5 text-sm text-muted">{s.body}</p>
              </div>
            </li>
          ))}
        </ol>
        <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-end">
          <Button
            variant="secondary"
            onClick={() => {
              dismiss();
              setComposer(true);
            }}
          >
            Paste my own log
          </Button>
          <Button
            onClick={() => {
              dismiss();
              void navigate({ to: "/queue" });
            }}
          >
            Open the live queue
          </Button>
        </div>
        <button
          type="button"
          className="mt-3 w-full text-center text-xs text-subtle hover:text-fg"
          onClick={dismiss}
        >
          I’ll look around first
        </button>
      </div>
    </div>
  );
}

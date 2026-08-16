import { useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { parseIncoming, SAMPLE_CRASH, SAMPLE_REVIEW, SAMPLE_VULN } from "@/lib/parse";
import { useAegis } from "@/lib/store";

export function NewSignalDialog() {
  const open = useAegis((s) => s.composerOpen);
  const setOpen = useAegis((s) => s.setComposerOpen);
  const ingestInput = useAegis((s) => s.ingestInput);
  const agentRunning = useAegis((s) => s.agentRunning);
  const navigate = useNavigate();
  const [raw, setRaw] = useState("");
  const [busy, setBusy] = useState(false);
  const preview = raw.trim() ? parseIncoming(raw) : null;

  async function submit() {
    if (!raw.trim() || busy || agentRunning) return;
    setBusy(true);
    try {
      const id = await ingestInput(raw);
      toast.success(`${id} is in the queue`);
      setRaw("");
      setOpen(false);
      await navigate({ to: "/queue/$incidentId", params: { incidentId: id } });
    } finally {
      setBusy(false);
    }
  }

  function onFile(file: File) {
    const reader = new FileReader();
    reader.onload = () => {
      const text = String(reader.result ?? "");
      setRaw(text);
    };
    reader.readAsText(file);
  }

  if (!open && !busy) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-lg">
        <DialogTitle>New signal</DialogTitle>
        <DialogDescription>
          Paste a crash stack, Snyk JSON, or a review CSV. This is how an on-call engineer drops work onto the desk when a webhook is late.
        </DialogDescription>

        <div className="mt-4 flex flex-wrap gap-2">
          <Button size="sm" variant="secondary" onClick={() => setRaw(SAMPLE_CRASH)}>
            Sample crash
          </Button>
          <Button size="sm" variant="secondary" onClick={() => setRaw(SAMPLE_VULN)}>
            Sample secret
          </Button>
          <Button size="sm" variant="secondary" onClick={() => setRaw(SAMPLE_REVIEW)}>
            Sample reviews
          </Button>
        </div>

        <label className="mt-4 block text-xs text-subtle">
          Payload
          <Textarea
            className="mt-1 min-h-40 font-mono text-xs"
            value={raw}
            onChange={(e) => setRaw(e.target.value)}
            placeholder={"FlutterError: ...\n#0  CheckoutSheetState._confirm"}
          />
        </label>

        <label className="mt-3 flex h-11 cursor-pointer items-center justify-center rounded-md text-sm text-muted shadow-[var(--shadow-border)] hover:bg-elevated hover:text-fg">
          Or upload a .txt / .json / .csv
          <input
            type="file"
            accept=".txt,.json,.csv,.log"
            className="sr-only"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) onFile(f);
            }}
          />
        </label>

        {preview && (
          <p className="mt-3 text-xs text-muted">
            Detected as <span className="text-fg">{preview.detected}</span> · {preview.kind} ·{" "}
            {preview.app}
          </p>
        )}

        <div className="mt-5 flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button disabled={!raw.trim() || busy || Boolean(agentRunning)} onClick={() => void submit()}>
            {busy ? "Running agent" : "Ingest and draft"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

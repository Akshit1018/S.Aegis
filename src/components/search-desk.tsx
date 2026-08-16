import { useNavigate } from "@tanstack/react-router";
import { Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { APP_LABEL } from "@/lib/format";
import { useAegis } from "@/lib/store";

export function SearchDesk() {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const incidents = useAegis((s) => s.incidents);
  const tickets = useAegis((s) => s.tickets);
  const navigate = useNavigate();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const needle = q.trim().toLowerCase();
  const hits = useMemo(() => {
    if (!needle) return incidents.slice(0, 8);
    return incidents
      .filter((i) =>
        `${i.id} ${i.title} ${i.summary} ${i.raw} ${i.ticketKey ?? ""}`.toLowerCase().includes(needle),
      )
      .slice(0, 10);
  }, [incidents, needle]);

  const ticketHits = useMemo(() => {
    if (!needle) return [];
    return tickets.filter((t) => `${t.key} ${t.title}`.toLowerCase().includes(needle)).slice(0, 4);
  }, [tickets, needle]);

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        aria-label="Search desk"
        onClick={() => setOpen(true)}
      >
        <Search className="size-4" />
      </Button>
      {open && (
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="p-0 sm:max-w-lg">
          <div className="border-b border-border p-3">
            <DialogTitle className="sr-only">Search</DialogTitle>
            <DialogDescription className="sr-only">Find incidents and tickets</DialogDescription>
            <Input
              autoFocus
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search INC-1842, UPI, Snyk…"
            />
          </div>
          <ul className="max-h-80 overflow-auto p-2">
            {hits.map((i) => (
              <li key={i.id}>
                <button
                  type="button"
                  className="flex w-full flex-col items-start rounded-md px-3 py-2 text-left hover:bg-elevated"
                  onClick={() => {
                    setOpen(false);
                    void navigate({ to: "/queue/$incidentId", params: { incidentId: i.id } });
                  }}
                >
                  <span className="font-mono text-xs text-subtle">{i.id}</span>
                  <span className="text-sm">{i.title}</span>
                  <span className="text-xs text-muted">
                    {APP_LABEL[i.app]} · {i.status}
                  </span>
                </button>
              </li>
            ))}
            {ticketHits.map((t) => (
              <li key={t.key}>
                <button
                  type="button"
                  className="flex w-full flex-col items-start rounded-md px-3 py-2 text-left hover:bg-elevated"
                  onClick={() => {
                    setOpen(false);
                    void navigate({ to: "/ticket/$key", params: { key: t.key } });
                  }}
                >
                  <span className="font-mono text-xs text-subtle">{t.key}</span>
                  <span className="text-sm">{t.title}</span>
                </button>
              </li>
            ))}
            {hits.length === 0 && ticketHits.length === 0 && (
              <li className="px-3 py-6 text-center text-sm text-muted">No matches</li>
            )}
          </ul>
        </DialogContent>
      </Dialog>
      )}
    </>
  );
}

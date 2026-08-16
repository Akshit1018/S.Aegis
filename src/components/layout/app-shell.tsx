import type { ReactNode } from "react";
import { useEffect } from "react";
import { useAegis } from "@/lib/store";
import { Sidebar } from "./sidebar";
import { Topbar } from "./topbar";

export function AppShell({ title, children }: { title: string; children: ReactNode }) {
  const runAgent = useAegis((s) => s.runAgent);
  const agentRunning = useAegis((s) => s.agentRunning);
  const pending = useAegis((s) =>
    s.incidents.find((i) => i.status === "ingested" || i.status === "classifying"),
  );

  useEffect(() => {
    if (pending && !agentRunning) {
      void runAgent(pending.id);
    }
  }, [pending, agentRunning, runAgent]);

  return (
    <div className="flex min-h-dvh bg-bg text-fg">
      <aside className="sticky top-0 hidden h-dvh w-60 shrink-0 border-r border-border lg:block">
        <Sidebar />
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar title={title} />
        <main className="flex-1 px-3 py-5 sm:px-5 lg:px-8">{children}</main>
      </div>
    </div>
  );
}

import { Check, Circle, LoaderCircle, Pause } from "lucide-react";
import { cn } from "@/lib/cn";
import type { AgentTraceStep } from "@/lib/types";

export function AgentTrace({ steps }: { steps: AgentTraceStep[] }) {
  return (
    <ol className="space-y-0">
      {steps.map((s, idx) => (
        <li key={s.id} className="flex gap-3">
          <div className="flex flex-col items-center">
            <span
              className={cn(
                "grid size-6 place-items-center rounded-full",
                s.status === "ok" && "bg-ok-soft text-ok",
                s.status === "running" && "bg-info-soft text-info",
                s.status === "wait" && "bg-warn-soft text-warn",
                s.status === "pending" && "bg-elevated text-subtle",
              )}
            >
              {s.status === "ok" && <Check className="size-3.5" />}
              {s.status === "running" && <LoaderCircle className="size-3.5 animate-spin" />}
              {s.status === "wait" && <Pause className="size-3.5" />}
              {s.status === "pending" && <Circle className="size-3" />}
            </span>
            {idx < steps.length - 1 && <span className="w-px flex-1 bg-border" />}
          </div>
          <div className={cn("min-w-0 flex-1 pb-4", idx === steps.length - 1 && "pb-0")}>
            <div className="flex items-baseline justify-between gap-2">
              <p className="text-sm font-medium">{s.label}</p>
              {typeof s.ms === "number" && s.status === "ok" && (
                <span className="font-mono text-xs text-subtle tabular">{s.ms}ms</span>
              )}
            </div>
            {s.detail && <p className="mt-0.5 text-xs text-muted">{s.detail}</p>}
          </div>
        </li>
      ))}
    </ol>
  );
}

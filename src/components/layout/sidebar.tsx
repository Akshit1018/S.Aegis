import { Link, useRouterState } from "@tanstack/react-router";
import { Smartphone } from "lucide-react";
import { AegisMark } from "@/components/mark";
import { cn } from "@/lib/cn";
import { ROLES } from "@/lib/seed";
import { queueIncidents, useAegis } from "@/lib/store";
import { NAV } from "./nav";

export function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const role = useAegis((s) => s.role);
  const setRole = useAegis((s) => s.setRole);
  const pending = useAegis((s) => queueIncidents(s.incidents).length);
  const current = ROLES.find((r) => r.id === role)!;

  return (
    <div className="flex h-full flex-col bg-surface">
      <div className="flex items-center gap-2.5 px-4 pt-5 pb-4">
        <AegisMark className="size-7" />
        <div className="min-w-0">
          <p className="text-sm font-semibold tracking-tight">Aegis</p>
          <p className="text-xs text-subtle">NivaPay · Security ops</p>
        </div>
      </div>

      <nav className="flex-1 space-y-0.5 px-2">
        {NAV.map((item) => {
          const active =
            "exact" in item && item.exact
              ? pathname === "/"
              : pathname === item.to || pathname.startsWith(`${item.to}/`);
          const Icon = item.icon;
          return (
            <Link
              key={item.to}
              to={item.to}
              onClick={onNavigate}
              className={cn(
                "flex h-10 items-center gap-2.5 rounded-md px-2.5 text-sm transition-colors duration-150",
                active ? "bg-elevated text-fg" : "text-muted hover:bg-elevated/60 hover:text-fg",
              )}
            >
              <Icon className="size-4 shrink-0" />
              <span className="flex-1">{item.label}</span>
              {item.to === "/queue" && pending > 0 && (
                <span className="grid min-w-5 place-items-center rounded-full bg-warn-soft px-1.5 text-xs text-warn tabular">
                  {pending}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto border-t border-border p-3">
        <p className="mb-2 px-1 text-xs text-subtle">Desk role</p>
        <div className="space-y-0.5">
          {ROLES.map((r) => (
            <button
              key={r.id}
              type="button"
              onClick={() => setRole(r.id)}
              className={cn(
                "flex h-11 w-full items-center gap-2.5 rounded-md px-2 text-left transition-colors duration-150",
                r.id === role ? "bg-elevated" : "hover:bg-elevated/50",
              )}
            >
              <span className="grid size-7 place-items-center rounded-full bg-inset text-xs font-medium">
                {r.initials}
              </span>
              <span className="min-w-0">
                <span className="block truncate text-sm">{r.name}</span>
                <span className="block truncate text-xs text-subtle">{r.title}</span>
              </span>
            </button>
          ))}
        </div>
        <Link
          to="/mobile"
          onClick={onNavigate}
          className="mt-2 flex h-10 items-center gap-2 rounded-md px-2 text-sm text-muted hover:bg-elevated hover:text-fg"
        >
          <Smartphone className="size-4" />
          On-call companion
        </Link>
        <p className="mt-3 px-1 text-[11px] leading-snug text-subtle">
          Acting as {current.name}. Approvals are signed in the audit log.
        </p>
      </div>
    </div>
  );
}

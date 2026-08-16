import { createFileRoute, Link } from "@tanstack/react-router";
import { AegisMark } from "@/components/mark";
import { Button } from "@/components/ui/button";
import { GROK_PROVIDERS, authEnabled, signIn } from "@/lib/auth/client";

export const Route = createFileRoute("/login")({ component: Login });

function Login() {
  return (
    <div className="flex min-h-dvh flex-col bg-bg text-fg">
      <div className="flex flex-1 flex-col justify-between px-6 py-10 sm:px-12 lg:flex-row lg:items-stretch lg:px-16 lg:py-16">
        <div className="flex max-w-xl flex-col justify-between">
          <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted hover:text-fg">
            <AegisMark className="size-6" />
            Aegis
          </Link>
          <div className="mt-16 lg:mt-0">
            <p className="text-xs tracking-wide text-subtle uppercase">NivaPay · customer engagement</p>
            <h1 className="mt-3 text-4xl font-medium tracking-tight sm:text-5xl">
              Security writes stay human.
            </h1>
            <p className="mt-5 max-w-md text-base text-muted">
              Crashes, scanner findings, and store reviews become a drafted ticket. The agent stops before Linear. You decide.
            </p>
          </div>
          <p className="mt-16 hidden text-xs text-subtle lg:block">
            Simulated tenant · NivaPay consumer + NivaBiz merchant
          </p>
        </div>

        <div className="mt-14 w-full max-w-sm self-center lg:mt-0 lg:self-center">
          <div className="rounded-2xl bg-surface p-6 shadow-[var(--shadow-border)]">
            <h2 className="text-base font-medium">Sign in to the desk</h2>
            <p className="mt-1 text-sm text-muted">
              Google or X. The console is also usable without an account for this demo.
            </p>
            <div className="mt-5 space-y-2">
              {authEnabled ? (
                GROK_PROVIDERS.map((p) => (
                  <Button
                    key={p.providerId}
                    type="button"
                    variant="secondary"
                    className="h-11 w-full"
                    onClick={() => void signIn(p.providerId, { callbackURL: "/" })}
                  >
                    Continue with {p.label}
                  </Button>
                ))
              ) : (
                <p className="text-sm text-muted">Sign-in is disabled in this environment.</p>
              )}
            </div>
            <Link
              to="/"
              className="mt-4 flex h-11 items-center justify-center text-sm text-muted hover:text-fg"
            >
              Continue without signing in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

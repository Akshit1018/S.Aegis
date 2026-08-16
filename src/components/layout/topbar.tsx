import { Link } from "@tanstack/react-router";
import { Bell, Menu, Plus } from "lucide-react";
import { useState } from "react";
import { authEnabled, signOut } from "@/lib/auth/client";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { useAegis } from "@/lib/store";
import { SearchDesk } from "../search-desk";
import { Button } from "../ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger } from "../ui/sheet";
import { Sidebar } from "./sidebar";

export function Topbar({ title }: { title: string }) {
  const [open, setOpen] = useState(false);
  const notes = useAegis((s) => s.notes);
  const ackNote = useAegis((s) => s.ackNote);
  const ackAll = useAegis((s) => s.ackAll);
  const unread = notes.filter((n) => !n.read).length;
  const setComposer = useAegis((s) => s.setComposerOpen);
  const { user, isPending } = useCurrentUserState();

  return (
    <header className="flex h-14 shrink-0 items-center gap-3 border-b border-border px-3 sm:px-5">
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Open navigation">
            <Menu className="size-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="p-0">
          <Sidebar onNavigate={() => setOpen(false)} />
        </SheetContent>
      </Sheet>

      <h1 className="min-w-0 flex-1 truncate text-sm font-medium sm:text-base">{title}</h1>

      <Button
        size="sm"
        onClick={() => setComposer(true)}
        className="hidden sm:inline-flex"
      >
        <Plus className="size-4" />
        New signal
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="sm:hidden"
        aria-label="New signal"
        onClick={() => setComposer(true)}
      >
        <Plus className="size-4" />
      </Button>
      <SearchDesk />

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="relative" aria-label="Notifications">
            <Bell className="size-4" />
            {unread > 0 && (
              <span className="absolute top-2 right-2 size-1.5 rounded-full bg-danger" />
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-80">
          <DropdownMenuLabel className="flex items-center justify-between">
            <span>On-call</span>
            {unread > 0 && (
              <button type="button" className="text-xs text-muted hover:text-fg" onClick={ackAll}>
                Mark all read
              </button>
            )}
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          {notes.slice(0, 6).map((n) =>
            n.incidentId ? (
              <DropdownMenuItem key={n.id} asChild>
                <Link
                  to="/queue/$incidentId"
                  params={{ incidentId: n.incidentId }}
                  onClick={() => ackNote(n.id)}
                  className={n.read ? "opacity-60" : ""}
                >
                  <span className="min-w-0">
                    <span className="block text-sm">{n.title}</span>
                    <span className="block truncate text-xs text-muted">{n.body}</span>
                  </span>
                </Link>
              </DropdownMenuItem>
            ) : (
              <DropdownMenuItem key={n.id} asChild>
                <Link to="/queue" onClick={() => ackNote(n.id)} className={n.read ? "opacity-60" : ""}>
                  <span className="min-w-0">
                    <span className="block text-sm">{n.title}</span>
                    <span className="block truncate text-xs text-muted">{n.body}</span>
                  </span>
                </Link>
              </DropdownMenuItem>
            ),
          )}
          {notes.length === 0 && (
            <div className="px-2.5 py-3 text-sm text-muted">No notifications</div>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <div className="hidden items-center sm:flex">
        {isPending ? (
          <div className="size-8 animate-pulse rounded-full bg-elevated" />
        ) : user ? (
          <div className="flex items-center gap-2">
            {user.profileImageUrl ? (
              <img
                src={user.profileImageUrl}
                alt=""
                className="size-8 rounded-full object-cover outline outline-1 -outline-offset-1 outline-fg/10"
              />
            ) : (
              <span className="grid size-8 place-items-center rounded-full bg-elevated text-xs font-medium">
                {(user.displayName ?? user.primaryEmail ?? "A").charAt(0).toUpperCase()}
              </span>
            )}
            <span className="max-w-28 truncate text-sm">
              {user.displayName ?? user.primaryEmail ?? "Account"}
            </span>
            {authEnabled && (
              <button
                type="button"
                onClick={() => void signOut()}
                className="text-xs text-muted hover:text-fg"
              >
                Sign out
              </button>
            )}
          </div>
        ) : (
          <Link to="/login" className="text-sm text-muted hover:text-fg">
            Sign in
          </Link>
        )}
      </div>
    </header>
  );
}

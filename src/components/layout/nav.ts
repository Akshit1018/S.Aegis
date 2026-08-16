import {
  Activity,
  BookOpen,
  ClipboardCheck,
  Inbox,
  LayoutDashboard,
  Radio,
  ScrollText,
  Ticket,
} from "lucide-react";

export const NAV = [
  { to: "/", label: "Command", icon: LayoutDashboard, exact: true },
  { to: "/queue", label: "Approval queue", icon: ClipboardCheck },
  { to: "/inbox", label: "Inbox", icon: Inbox },
  { to: "/tickets", label: "Tickets", icon: Ticket },
  { to: "/sources", label: "Sources", icon: Radio },
  { to: "/evals", label: "Evals", icon: Activity },
  { to: "/audit", label: "Audit", icon: ScrollText },
  { to: "/guide", label: "How it works", icon: BookOpen },
] as const;

import { Badge } from "@/components/ui/badge";
import { STATUS_LABEL } from "@/lib/format";
import type { IncidentStatus } from "@/lib/types";

const TONE: Record<IncidentStatus, "neutral" | "warn" | "ok" | "danger" | "info" | "fg"> = {
  ingested: "neutral",
  classifying: "info",
  drafted: "info",
  awaiting_approval: "warn",
  approved: "ok",
  ticketed: "ok",
  rejected: "neutral",
  escalated: "danger",
};

export function StatusBadge({ status }: { status: IncidentStatus }) {
  return <Badge tone={TONE[status]}>{STATUS_LABEL[status]}</Badge>;
}

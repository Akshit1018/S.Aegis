import { Badge } from "@/components/ui/badge";
import { SEVERITY_LABEL, severityTone } from "@/lib/format";
import type { Severity } from "@/lib/types";

export function SeverityBadge({ severity, compact }: { severity: Severity; compact?: boolean }) {
  return <Badge tone={severityTone(severity)}>{compact ? severity : SEVERITY_LABEL[severity]}</Badge>;
}

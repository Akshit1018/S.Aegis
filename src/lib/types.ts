export type SourceKind =
  | "crashlytics"
  | "sentry"
  | "snyk"
  | "play_reviews"
  | "appstore"
  | "manual";

export type IncidentKind = "crash" | "vuln" | "review";
export type Severity = "P0" | "P1" | "P2" | "P3" | "P4";
export type AppId = "consumer" | "merchant";
export type Platform = "ios" | "android" | "both";

export type IncidentStatus =
  | "ingested"
  | "classifying"
  | "drafted"
  | "awaiting_approval"
  | "approved"
  | "rejected"
  | "escalated"
  | "ticketed";

export type RoleId = "oncall" | "manager" | "triage" | "operator";

export type AgentStep =
  | "ingest"
  | "embed"
  | "retrieve"
  | "classify"
  | "prioritize"
  | "draft_fix"
  | "draft_ticket"
  | "hitl";

export interface SimilarIssue {
  id: string;
  ticketKey: string;
  title: string;
  resolution: string;
  similarity: number;
  closedAt: string;
}

export interface DraftTicket {
  project: "MOBILE" | "SEC" | "SUPPORT";
  keyPreview: string;
  title: string;
  description: string;
  labels: string[];
  assignee: string;
  priority: Severity;
}

export interface AgentTraceStep {
  id: AgentStep;
  label: string;
  status: "pending" | "running" | "ok" | "wait";
  detail: string;
  ms?: number;
}

export interface DeskComment {
  id: string;
  incidentId: string;
  author: string;
  body: string;
  ts: string;
}

export interface Incident {
  id: string;
  source: SourceKind;
  kind: IncidentKind;
  title: string;
  summary: string;
  raw: string;
  app: AppId;
  appVersion: string;
  platform: Platform;
  deviceHint?: string;
  severity: Severity;
  blastRadius: number;
  affectedUsers: number;
  occurrences: number;
  confidence: number;
  status: IncidentStatus;
  classification: string;
  suggestedFix: string;
  suggestedPatch?: string;
  similarIssues: SimilarIssue[];
  draftTicket: DraftTicket;
  trace: AgentTraceStep[];
  createdAt: string;
  updatedAt: string;
  tags: string[];
  rejectReason?: string;
  approvedBy?: string;
  ticketKey?: string;
}

export interface Ticket {
  key: string;
  incidentId: string;
  project: DraftTicket["project"];
  title: string;
  status: "backlog" | "todo" | "in_progress" | "done";
  priority: Severity;
  assignee: string;
  labels: string[];
  createdAt: string;
  url: string;
}

export interface AuditEvent {
  id: string;
  ts: string;
  actor: string;
  action: string;
  incidentId?: string;
  detail: string;
}

export interface EvalCase {
  id: string;
  name: string;
  source: SourceKind;
  expectedSeverity: Severity;
  predictedSeverity: Severity;
  expectedAction: "ticket" | "escalate" | "ignore";
  predictedAction: "ticket" | "escalate" | "ignore";
  humanAccepted: boolean | null;
  latencyMs: number;
}

export interface SourceHealth {
  id: SourceKind;
  label: string;
  lastPullAt: string;
  events24h: number;
  status: "healthy" | "degraded" | "down";
  note: string;
}

export interface ActivityItem {
  id: string;
  ts: string;
  text: string;
  tone: "neutral" | "ok" | "warn" | "danger";
}

export interface Role {
  id: RoleId;
  name: string;
  title: string;
  initials: string;
}

export interface PushNote {
  id: string;
  title: string;
  body: string;
  incidentId?: string;
  ts: string;
  read: boolean;
}

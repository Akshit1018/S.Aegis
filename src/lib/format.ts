import { formatDistanceToNowStrict, parseISO } from "date-fns";
import type { AppId, IncidentStatus, Platform, Severity, SourceKind } from "./types";

export function relTime(iso: string): string {
  try {
    return formatDistanceToNowStrict(parseISO(iso), { addSuffix: true });
  } catch {
    return iso;
  }
}

export function compactNum(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(n >= 10_000 ? 0 : 1)}k`;
  return String(n);
}

export const SEVERITY_LABEL: Record<Severity, string> = {
  P0: "P0 · Critical",
  P1: "P1 · High",
  P2: "P2 · Medium",
  P3: "P3 · Low",
  P4: "P4 · Info",
};

export const APP_LABEL: Record<AppId, string> = {
  consumer: "NivaPay",
  merchant: "NivaBiz",
};

export const PLATFORM_LABEL: Record<Platform, string> = {
  ios: "iOS",
  android: "Android",
  both: "iOS + Android",
};

export const SOURCE_LABEL: Record<SourceKind, string> = {
  crashlytics: "Crashlytics",
  sentry: "Sentry",
  snyk: "Snyk",
  play_reviews: "Play Reviews",
  appstore: "App Store",
  manual: "Pasted / upload",
};

export const STATUS_LABEL: Record<IncidentStatus, string> = {
  ingested: "Ingested",
  classifying: "Classifying",
  drafted: "Drafted",
  awaiting_approval: "Awaiting approval",
  approved: "Approved",
  rejected: "Rejected",
  escalated: "Escalated",
  ticketed: "Ticketed",
};

export function severityTone(s: Severity): "danger" | "warn" | "ok" | "info" {
  if (s === "P0") return "danger";
  if (s === "P1") return "warn";
  if (s === "P2") return "info";
  return "ok";
}

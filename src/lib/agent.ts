import type { AgentTraceStep, Incident, SimilarIssue } from "./types";
import { INITIAL_INCIDENTS } from "./seed";

export function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

const HISTORICAL: SimilarIssue[] = [
  {
    id: "INC-1611",
    ticketKey: "MOBILE-3618",
    title: "Empty IFSC list NPE on add-beneficiary",
    resolution: "Null-safe empty state + retry; rolled back 3.9.4.",
    similarity: 0.71,
    closedAt: new Date("2026-06-28T10:00:00+05:30").toISOString(),
  },
  {
    id: "INC-1544",
    ticketKey: "MOBILE-3480",
    title: "UPI intent null after NPCI timeout",
    resolution: "Timeout treated as empty result, not crash.",
    similarity: 0.64,
    closedAt: new Date("2026-06-03T10:00:00+05:30").toISOString(),
  },
  {
    id: "INC-1702",
    ticketKey: "MOBILE-3820",
    title: "Camera freeze on first scan after permission grant",
    resolution: "Rebound use-case once; removed duplicate preview.",
    similarity: 0.58,
    closedAt: new Date("2026-07-23T10:00:00+05:30").toISOString(),
  },
  {
    id: "INC-1488",
    ticketKey: "SUPPORT-2201",
    title: "Double debit cluster after NPCI timeout",
    resolution: "Idempotency key on webhook + Play reply playbook.",
    similarity: 0.66,
    closedAt: new Date("2026-05-17T10:00:00+05:30").toISOString(),
  },
  {
    id: "INC-1320",
    ticketKey: "SEC-884",
    title: "Firebase API key committed to consumer app",
    resolution: "Rotated, moved to remote config, added gitleaks.",
    similarity: 0.62,
    closedAt: new Date("2026-04-14T10:00:00+05:30").toISOString(),
  },
];

function scoreSimilar(inc: Incident): SimilarIssue[] {
  const pool = [
    ...HISTORICAL,
    ...INITIAL_INCIDENTS.filter((i) => i.id !== inc.id && i.similarIssues.length).flatMap((i) => i.similarIssues),
  ];
  const seen = new Set<string>();
  const out: SimilarIssue[] = [];
  for (const s of pool) {
    if (seen.has(s.id)) continue;
    seen.add(s.id);
    const bump =
      (inc.kind === "crash" && /NPE|null|ANR|EXC/i.test(s.title) ? 0.12 : 0) +
      (inc.kind === "vuln" && /key|CVE|WebView/i.test(s.title) ? 0.16 : 0) +
      (inc.kind === "review" && /debit|OTP|review/i.test(s.title) ? 0.14 : 0);
    out.push({ ...s, similarity: Math.min(0.94, s.similarity + bump) });
  }
  return out.sort((a, b) => b.similarity - a.similarity).slice(0, 3);
}

export interface AgentResult {
  classification: string;
  severity: Incident["severity"];
  blastRadius: number;
  confidence: number;
  suggestedFix: string;
  suggestedPatch?: string;
  similarIssues: SimilarIssue[];
  draftTicket: Incident["draftTicket"];
}

export function resolveAgent(inc: Incident): AgentResult {
  const similar = inc.similarIssues.length ? inc.similarIssues : scoreSimilar(inc);
  const text = `${inc.title} ${inc.raw}`.toLowerCase();

  if (text.includes("rzp_live") || text.includes("hardcoded") || text.includes("secret")) {
    return {
      classification: "Secret exposure · payments · public bundle",
      severity: "P0",
      blastRadius: 94,
      confidence: 0.97,
      suggestedFix:
        "Rotate the exposed key immediately. Remove from source, load from remote config, add gitleaks to CI.",
      suggestedPatch: `export const RZP_KEY = remoteConfig.getString('rzp_key');`,
      similarIssues: similar,
      draftTicket: {
        project: "SEC",
        keyPreview: inc.draftTicket.keyPreview || "SEC-1408",
        title: `[P0] Rotate leaked secret — ${inc.title.slice(0, 48)}`,
        description: `${inc.summary}\n\nWrite actions require human approval.`,
        labels: ["secret", "p0", "snyk"],
        assignee: "priya.mehta",
        priority: "P0",
      },
    };
  }

  if (text.includes("exc_bad_access") || text.includes("biometric")) {
    return {
      classification: "Crash · biometric · iOS 18 memory",
      severity: "P1",
      blastRadius: 54,
      confidence: 0.86,
      suggestedFix:
        "LAContext is deallocated while the evaluatePolicy callback is in flight. Retain the context on the unlock controller until the reply returns.",
      suggestedPatch: `// BiometricUnlock.swift
self.context = LAContext()
context.evaluatePolicy(.deviceOwnerAuthenticationWithBiometrics, ...) { [weak self] ok, err in
  self?.finish(ok, err)
}`,
      similarIssues: similar,
      draftTicket: {
        project: "MOBILE",
        keyPreview: inc.draftTicket.keyPreview || "MOBILE-4092",
        title: "[P1] Retain LAContext across evaluatePolicy — iOS 18.6",
        description: inc.summary,
        labels: ["ios", "biometric", "crash"],
        assignee: "meera.kapoor",
        priority: "P1",
      },
    };
  }

  if (text.includes("otp") && (text.includes("late") || text.includes("review"))) {
    return {
      classification: "Review cluster · SMS provider · not client",
      severity: "P3",
      blastRadius: 18,
      confidence: 0.64,
      suggestedFix:
        "Escalate to messaging, not mobile. Draft a support macro. Do not ship a client hotfix.",
      similarIssues: similar,
      draftTicket: {
        project: "SUPPORT",
        keyPreview: inc.draftTicket.keyPreview || "SUPPORT-3118",
        title: "[P3] OTP latency review cluster — escalate to messaging",
        description: inc.summary,
        labels: ["otp", "reviews"],
        assignee: "kavya.iyer",
        priority: "P3",
      },
    };
  }

  if (text.includes("null") || text.includes("banks")) {
    return {
      classification: "Crash · payment collect · null-safety regression",
      severity: "P0",
      blastRadius: 86,
      confidence: 0.93,
      suggestedFix: "Guard empty bank list. Pause 4.18.2 Android rollout.",
      suggestedPatch: `if (banks.isEmpty) { setState(() => _emptyBanks = true); return; }`,
      similarIssues: similar,
      draftTicket: {
        project: "MOBILE",
        keyPreview: inc.draftTicket.keyPreview || "MOBILE-4091",
        title: "[P0] Guard empty bank list in UpiCollectSheet",
        description: inc.summary,
        labels: ["crash", "upi", "p0"],
        assignee: "meera.kapoor",
        priority: "P0",
      },
    };
  }

  return {
    classification:
      inc.kind === "vuln"
        ? "Vulnerability · needs review"
        : inc.kind === "review"
          ? "Review cluster · needs triage"
          : /exception|error|crash|anr|null/i.test(text)
            ? "Crash · needs owner"
            : "Signal · needs human read",
    severity: inc.severity === "P4" ? "P3" : inc.kind === "crash" ? "P1" : inc.severity,
    blastRadius: Math.max(inc.blastRadius, inc.kind === "crash" ? 42 : 28),
    confidence: 0.72,
    suggestedFix:
      inc.suggestedFix ||
      "Read the raw signal, confirm the owner team, and only then approve the draft ticket.",
    suggestedPatch: inc.suggestedPatch,
    similarIssues: similar,
    draftTicket: {
      ...inc.draftTicket,
      title: inc.draftTicket.title || `[${inc.kind === "crash" ? "P1" : inc.severity}] ${inc.title}`,
      description: inc.draftTicket.description || inc.summary || inc.raw.slice(0, 400),
      labels: inc.draftTicket.labels.length ? inc.draftTicket.labels : [inc.kind],
    },
  };
}

export const STEP_ORDER: AgentTraceStep["id"][] = [
  "ingest",
  "embed",
  "retrieve",
  "classify",
  "prioritize",
  "draft_fix",
  "draft_ticket",
  "hitl",
];

export function applyStep(
  trace: AgentTraceStep[],
  step: AgentTraceStep["id"],
  detail: string,
  ms?: number,
): AgentTraceStep[] {
  const idx = STEP_ORDER.indexOf(step);
  return trace.map((s, i) => {
    if (s.id === step) {
      return {
        ...s,
        status: step === "hitl" ? "wait" : "ok",
        detail,
        ms: ms ?? s.ms,
      };
    }
    if (i === idx + 1) return { ...s, status: "running", detail: s.detail || "Running" };
    return s;
  });
}

export interface IngestTemplate {
  title: string;
  kind: Incident["kind"];
  source: Incident["source"];
  app: Incident["app"];
  platform: Incident["platform"];
  appVersion: string;
  raw: string;
  summary: string;
  tags: string[];
}

export const INGEST_POOL: IngestTemplate[] = [
  {
    title: "PlayIntegrity API timeout on rooted-device path",
    kind: "crash",
    source: "sentry",
    app: "consumer",
    platform: "android",
    appVersion: "4.18.2",
    summary: "Integrity token fetch hangs 12s then throws. 340 sessions since noon.",
    raw: `java.net.SocketTimeoutException: failed to connect to play.googleapis.com
at IntegrityManager.requestIntegrityToken
sessions: 340`,
    tags: ["integrity", "android"],
  },
  {
    title: "Insecure Random used for mandate reference IDs",
    kind: "vuln",
    source: "snyk",
    app: "consumer",
    platform: "both",
    appVersion: "4.18.2",
    summary: "java.util.Random for UPI mandate refs — predictable IDs.",
    raw: `{ "rule": "InsecureRandom", "file": "MandateIds.kt", "line": 22 }`,
    tags: ["crypto", "upi"],
  },
  {
    title: "Review cluster: 'merchant settlement delayed'",
    kind: "review",
    source: "play_reviews",
    app: "merchant",
    platform: "android",
    appVersion: "2.9.1",
    summary: "19 one-star reviews after T+1 settlement slipped to T+2 in West Bengal.",
    raw: `"Settlement nahi aaya kal se. 2.9.1 update ke baad." cluster=19`,
    tags: ["settlement", "reviews"],
  },
];

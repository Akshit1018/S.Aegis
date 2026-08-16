import { create } from "zustand";
import { resolveAgent, applyStep, sleep, INGEST_POOL, type IngestTemplate } from "./agent";
import { parseIncoming } from "./parse";
import {
  INITIAL_ACTIVITY,
  INITIAL_AUDIT,
  INITIAL_COMMENTS,
  INITIAL_EVALS,
  INITIAL_INCIDENTS,
  INITIAL_NOTES,
  INITIAL_SOURCES,
  INITIAL_TICKETS,
  ROLES,
} from "./seed";
import type {
  ActivityItem,
  AuditEvent,
  DeskComment,
  DraftTicket,
  EvalCase,
  Incident,
  PushNote,
  RoleId,
  SourceHealth,
  Ticket,
} from "./types";

const STORAGE_KEY = "aegis-desk-v2";

function nowIso(): string {
  return new Date().toISOString();
}

function nid(prefix: string): string {
  return `${prefix}-${Math.random().toString(36).slice(2, 8)}`;
}

function nextIncidentId(existing: Incident[]): string {
  const nums = existing.map((i) => Number(i.id.replace("INC-", ""))).filter((n) => !Number.isNaN(n));
  return `INC-${Math.max(1800, ...nums) + 1}`;
}

export interface PersistedSlice {
  role: RoleId;
  incidents: Incident[];
  tickets: Ticket[];
  audit: AuditEvent[];
  evals: EvalCase[];
  sources: SourceHealth[];
  activity: ActivityItem[];
  notes: PushNote[];
  comments: DeskComment[];
  seenGuide: boolean;
  sourceFailure: string | null;
}

export interface AegisState extends PersistedSlice {
  hydrated: boolean;
  agentRunning: string | null;
  evalRunning: boolean;
  composerOpen: boolean;
  setRole: (r: RoleId) => void;
  setComposerOpen: (open: boolean) => void;
  dismissGuide: () => void;
  updateDraft: (id: string, patch: Partial<DraftTicket>) => void;
  approve: (id: string) => void;
  reject: (id: string, reason: string) => void;
  escalate: (id: string) => void;
  runAgent: (id: string) => Promise<void>;
  ingest: (template?: IngestTemplate) => Promise<string>;
  ingestInput: (raw: string, filename?: string) => Promise<string>;
  injectSpike: () => Promise<void>;
  injectFailure: () => void;
  recoverSource: () => void;
  runEvals: () => Promise<void>;
  ackNote: (id: string) => void;
  ackAll: () => void;
  addComment: (incidentId: string, body: string) => void;
  setTicketStatus: (key: string, status: Ticket["status"]) => void;
  resetDemo: () => void;
  applyPersisted: (slice: PersistedSlice) => void;
}

function pushAudit(
  audit: AuditEvent[],
  event: Omit<AuditEvent, "id" | "ts">,
): AuditEvent[] {
  return [{ id: nid("aud"), ts: nowIso(), ...event }, ...audit].slice(0, 80);
}

function pushAct(
  activity: ActivityItem[],
  text: string,
  tone: ActivityItem["tone"],
): ActivityItem[] {
  return [{ id: nid("act"), ts: nowIso(), text, tone }, ...activity].slice(0, 24);
}

const freshSlice = (): PersistedSlice => ({
  role: "oncall",
  incidents: INITIAL_INCIDENTS,
  tickets: INITIAL_TICKETS,
  audit: INITIAL_AUDIT,
  evals: INITIAL_EVALS,
  sources: INITIAL_SOURCES,
  activity: INITIAL_ACTIVITY,
  notes: INITIAL_NOTES,
  comments: INITIAL_COMMENTS,
  seenGuide: false,
  sourceFailure: null,
});

export const useAegis = create<AegisState>((set, get) => ({
  ...freshSlice(),
  hydrated: false,
  agentRunning: null,
  evalRunning: false,
  composerOpen: false,

  applyPersisted: (slice) =>
    set({
      ...slice,
      incidents: slice.incidents?.length ? slice.incidents : INITIAL_INCIDENTS,
      tickets: slice.tickets?.length ? slice.tickets : INITIAL_TICKETS,
      comments: slice.comments ?? INITIAL_COMMENTS,
      hydrated: true,
      agentRunning: null,
      evalRunning: false,
    }),

  setRole: (role) => set({ role }),
  setComposerOpen: (composerOpen) => set({ composerOpen }),
  dismissGuide: () => set({ seenGuide: true }),

  updateDraft: (id, patch) =>
    set((s) => ({
      incidents: s.incidents.map((i) =>
        i.id === id ? { ...i, draftTicket: { ...i.draftTicket, ...patch }, updatedAt: nowIso() } : i,
      ),
    })),

  approve: (id) => {
    const role = ROLES.find((r) => r.id === get().role);
    const actor = role?.name ?? "Operator";
    set((s) => {
      const inc = s.incidents.find((i) => i.id === id);
      if (!inc) return s;
      const key = inc.draftTicket.keyPreview;
      const ticket: Ticket = {
        key,
        incidentId: id,
        project: inc.draftTicket.project,
        title: inc.draftTicket.title,
        status: "todo",
        priority: inc.draftTicket.priority,
        assignee: inc.draftTicket.assignee,
        labels: inc.draftTicket.labels,
        createdAt: nowIso(),
        url: "#",
      };
      const note: PushNote = {
        id: nid("n"),
        title: `Ticket ${key} created`,
        body: inc.draftTicket.title,
        incidentId: id,
        ts: nowIso(),
        read: false,
      };
      return {
        incidents: s.incidents.map((i) =>
          i.id === id
            ? {
                ...i,
                status: "ticketed" as const,
                ticketKey: key,
                approvedBy: actor,
                updatedAt: nowIso(),
                trace: i.trace.map((t) =>
                  t.id === "hitl" ? { ...t, status: "ok" as const, detail: `Approved by ${actor}` } : t,
                ),
              }
            : i,
        ),
        tickets: [ticket, ...s.tickets],
        audit: pushAudit(s.audit, {
          actor,
          action: "approve",
          incidentId: id,
          detail: `Created ${key}`,
        }),
        activity: pushAct(s.activity, `${actor} approved ${id} → ${key}`, "ok"),
        notes: [note, ...s.notes],
        comments: [
          {
            id: nid("c"),
            incidentId: id,
            author: actor,
            body: `Approved and filed ${key}.`,
            ts: nowIso(),
          },
          ...s.comments,
        ],
      };
    });
  },

  reject: (id, reason) => {
    const role = ROLES.find((r) => r.id === get().role);
    const actor = role?.name ?? "Operator";
    set((s) => ({
      incidents: s.incidents.map((i) =>
        i.id === id
          ? {
              ...i,
              status: "rejected" as const,
              rejectReason: reason,
              updatedAt: nowIso(),
              trace: i.trace.map((t) =>
                t.id === "hitl" ? { ...t, status: "ok" as const, detail: `Rejected · ${reason}` } : t,
              ),
            }
          : i,
      ),
      evals: s.evals.map((e) =>
        e.name.toLowerCase().includes(id.toLowerCase()) ? { ...e, humanAccepted: false } : e,
      ),
      audit: pushAudit(s.audit, { actor, action: "reject", incidentId: id, detail: reason }),
      activity: pushAct(s.activity, `${actor} rejected ${id}`, "warn"),
      comments: [
        { id: nid("c"), incidentId: id, author: actor, body: `Rejected: ${reason}`, ts: nowIso() },
        ...s.comments,
      ],
    }));
  },

  escalate: (id) => {
    const role = ROLES.find((r) => r.id === get().role);
    const actor = role?.name ?? "Operator";
    set((s) => ({
      incidents: s.incidents.map((i) =>
        i.id === id ? { ...i, status: "escalated" as const, updatedAt: nowIso() } : i,
      ),
      audit: pushAudit(s.audit, {
        actor,
        action: "escalate",
        incidentId: id,
        detail: "Low confidence / out of policy — sent to manager",
      }),
      activity: pushAct(s.activity, `${id} escalated to engineering manager`, "warn"),
    }));
  },

  runAgent: async (id) => {
    if (get().agentRunning) return;
    set({ agentRunning: id });
    const inc = get().incidents.find((i) => i.id === id);
    if (!inc) {
      set({ agentRunning: null });
      return;
    }

    const mark = (step: Incident["trace"][number]["id"], detail: string, ms?: number, extra?: Partial<Incident>) => {
      set((s) => ({
        incidents: s.incidents.map((i) =>
          i.id === id
            ? {
                ...i,
                status: step === "hitl" ? "awaiting_approval" : "classifying",
                trace: applyStep(i.trace, step, detail, ms),
                updatedAt: nowIso(),
                ...extra,
              }
            : i,
        ),
      }));
    };

    mark("ingest", "Payload normalized", 42);
    await sleep(280);
    mark("embed", "bge-small · 384d", 120);
    await sleep(360);

    const result = resolveAgent(inc);
    mark("retrieve", `${result.similarIssues.length} neighbors`, 210, {
      similarIssues: result.similarIssues,
    });
    await sleep(420);
    mark("classify", result.classification, 640, {
      classification: result.classification,
      severity: result.severity,
      confidence: result.confidence,
    });
    await sleep(380);
    mark("prioritize", `blast ${result.blastRadius}`, 80, {
      blastRadius: result.blastRadius,
    });
    await sleep(300);
    mark("draft_fix", "Patch + rationale", 790, {
      suggestedFix: result.suggestedFix,
      suggestedPatch: result.suggestedPatch,
    });
    await sleep(520);
    mark("draft_ticket", result.draftTicket.keyPreview, 280, {
      draftTicket: result.draftTicket,
    });
    await sleep(260);
    mark("hitl", "Write blocked until approval", undefined, {
      status: "awaiting_approval",
    });

    set((s) => ({
      agentRunning: null,
      audit: pushAudit(s.audit, {
        actor: "agent",
        action: "draft_ticket",
        incidentId: id,
        detail: `HITL interrupt · ${result.draftTicket.keyPreview} ready`,
      }),
      activity: pushAct(s.activity, `Agent drafted ${id} · waiting on human`, "neutral"),
      notes: [
        {
          id: nid("n"),
          title: `${result.severity} ready for approval`,
          body: result.draftTicket.title,
          incidentId: id,
          ts: nowIso(),
          read: false,
        },
        ...s.notes,
      ],
    }));
  },

  ingest: async (template) => {
    const tpl = template ?? INGEST_POOL[Math.floor(Math.random() * INGEST_POOL.length)]!;
    const id = nextIncidentId(get().incidents);
    const keyN = 4093 + get().incidents.length;
    const fresh: Incident = {
      id,
      source: tpl.source,
      kind: tpl.kind,
      title: tpl.title,
      summary: tpl.summary,
      raw: tpl.raw,
      app: tpl.app,
      appVersion: tpl.appVersion,
      platform: tpl.platform,
      severity: "P2",
      blastRadius: 0,
      affectedUsers: 0,
      occurrences: 0,
      confidence: 0,
      status: "ingested",
      classification: "",
      suggestedFix: "",
      similarIssues: [],
      draftTicket: {
        project: tpl.kind === "vuln" ? "SEC" : tpl.kind === "review" ? "SUPPORT" : "MOBILE",
        keyPreview: `${tpl.kind === "vuln" ? "SEC" : tpl.kind === "review" ? "SUPPORT" : "MOBILE"}-${keyN}`,
        title: "",
        description: "",
        labels: tpl.tags,
        assignee: tpl.kind === "vuln" ? "priya.mehta" : "meera.kapoor",
        priority: "P2",
      },
      trace: [
        { id: "ingest", label: "Ingest", status: "running", detail: "Accepting payload" },
        { id: "embed", label: "Embed", status: "pending", detail: "" },
        { id: "retrieve", label: "Retrieve similar", status: "pending", detail: "" },
        { id: "classify", label: "Classify", status: "pending", detail: "" },
        { id: "prioritize", label: "Prioritize", status: "pending", detail: "" },
        { id: "draft_fix", label: "Draft fix", status: "pending", detail: "" },
        { id: "draft_ticket", label: "Draft ticket", status: "pending", detail: "" },
        { id: "hitl", label: "HITL interrupt", status: "pending", detail: "" },
      ],
      createdAt: nowIso(),
      updatedAt: nowIso(),
      tags: tpl.tags,
    };
    set((s) => ({
      incidents: [fresh, ...s.incidents],
      sources: s.sources.map((src) =>
        src.id === tpl.source
          ? { ...src, events24h: src.events24h + 1, lastPullAt: nowIso() }
          : src,
      ),
      audit: pushAudit(s.audit, {
        actor: "agent",
        action: "ingest",
        incidentId: id,
        detail: `${tpl.source} · ${tpl.title}`,
      }),
      activity: pushAct(s.activity, `Ingested ${id} from ${tpl.source}`, "neutral"),
    }));
    await get().runAgent(id);
    return id;
  },

  ingestInput: async (raw, filename) => {
    const parsed = parseIncoming(raw, filename);
    return get().ingest(parsed);
  },

  injectSpike: async () => {
    await get().ingest({
      title: "Crash spike: UpiCollectSheet null after banks=[] (replay)",
      kind: "crash",
      source: "crashlytics",
      app: "consumer",
      platform: "android",
      appVersion: "4.18.2",
      summary: "Synthetic spike replay — same signature as INC-1842, new cohort 3.1k users.",
      raw: `FlutterError: Null check operator used on a null value
#0 UpiCollectSheetState._selectDefaultBank
sessions_affected: 3120`,
      tags: ["upi", "spike", "replay"],
    });
  },

  injectFailure: () => {
    set((s) => ({
      sourceFailure: "play_reviews",
      sources: s.sources.map((src) =>
        src.id === "play_reviews"
          ? { ...src, status: "down", note: "429 quota · circuit open 60s" }
          : src,
      ),
      activity: pushAct(s.activity, "Play Reviews circuit opened · 429 quota", "danger"),
      audit: pushAudit(s.audit, {
        actor: "operator",
        action: "circuit_open",
        detail: "Injected 429 on Play Reviews · graceful degradation",
      }),
    }));
  },

  recoverSource: () => {
    set((s) => ({
      sourceFailure: null,
      sources: s.sources.map((src) =>
        src.id === "play_reviews"
          ? { ...src, status: "healthy", note: "Quota recovered · backoff cleared" }
          : src,
      ),
      activity: pushAct(s.activity, "Play Reviews recovered · circuit closed", "ok"),
    }));
  },

  runEvals: async () => {
    set({ evalRunning: true });
    await sleep(900);
    set((s) => ({
      evalRunning: false,
      evals: s.evals.map((e) => ({
        ...e,
        latencyMs: e.latencyMs || 1400 + Math.floor(Math.random() * 600),
        predictedSeverity: e.predictedSeverity,
      })),
      activity: pushAct(s.activity, "Eval suite passed · precision 0.88 · recall 0.86", "ok"),
      audit: pushAudit(s.audit, {
        actor: "operator",
        action: "eval_run",
        detail: "Golden set n=12 · precision 0.88 · recall 0.86",
      }),
    }));
  },

  ackNote: (id) =>
    set((s) => ({ notes: s.notes.map((n) => (n.id === id ? { ...n, read: true } : n)) })),

  ackAll: () => set((s) => ({ notes: s.notes.map((n) => ({ ...n, read: true })) })),

  addComment: (incidentId, body) => {
    const role = ROLES.find((r) => r.id === get().role);
    const actor = role?.name ?? "Operator";
    const trimmed = body.trim();
    if (!trimmed) return;
    set((s) => ({
      comments: [
        { id: nid("c"), incidentId, author: actor, body: trimmed, ts: nowIso() },
        ...s.comments,
      ],
    }));
  },

  setTicketStatus: (key, status) => {
    const role = ROLES.find((r) => r.id === get().role);
    const actor = role?.name ?? "Operator";
    set((s) => ({
      tickets: s.tickets.map((t) => (t.key === key ? { ...t, status } : t)),
      audit: pushAudit(s.audit, {
        actor,
        action: "ticket_status",
        detail: `${key} → ${status}`,
      }),
    }));
  },

  resetDemo: () => set({ ...freshSlice(), agentRunning: null, evalRunning: false, hydrated: true }),
}));

export function queueIncidents(incidents: Incident[]): Incident[] {
  return incidents.filter(
    (i) =>
      i.status === "awaiting_approval" ||
      i.status === "classifying" ||
      i.status === "ingested" ||
      i.status === "drafted",
  );
}

export function hydrateDesk(): void {
  if (typeof window === "undefined") return;
  const state = useAegis.getState();
  if (state.hydrated) return;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as PersistedSlice;
      if (parsed && Array.isArray(parsed.incidents) && parsed.incidents.length > 0) {
        useAegis.getState().applyPersisted(parsed);
      } else {
        useAegis.setState({ hydrated: true });
      }
    } else {
      useAegis.setState({ hydrated: true });
    }
  } catch {
    useAegis.setState({ hydrated: true });
  }

  useAegis.subscribe((s) => {
    if (!s.hydrated) return;
    const slice: PersistedSlice = {
      role: s.role,
      incidents: s.incidents,
      tickets: s.tickets,
      audit: s.audit,
      evals: s.evals,
      sources: s.sources,
      activity: s.activity,
      notes: s.notes,
      comments: s.comments,
      seenGuide: s.seenGuide,
      sourceFailure: s.sourceFailure,
    };
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(slice));
    } catch {
      /* quota */
    }
  });
}

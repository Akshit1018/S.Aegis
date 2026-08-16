import type { AppId, IncidentKind, Platform, SourceKind } from "./types";
import type { IngestTemplate } from "./agent";

export interface ParseResult extends IngestTemplate {
  detected: string;
}

function firstLine(text: string): string {
  const line = text.split(/\r?\n/).map((l) => l.trim()).find(Boolean) ?? "Incoming signal";
  return line.length > 110 ? `${line.slice(0, 107)}…` : line;
}

function guessApp(text: string): AppId {
  return /nivabiz|merchant|qr scan|settlement/i.test(text) ? "merchant" : "consumer";
}

function guessPlatform(text: string): Platform {
  const ios = /iphone|ios|exc_bad_access|swift|uikit/i.test(text);
  const and = /android|kotlin|\.dart|okhttp|camerax/i.test(text);
  if (ios && and) return "both";
  if (ios) return "ios";
  if (and) return "android";
  return "both";
}

function versionOf(text: string): string {
  const m = text.match(/\b(\d+\.\d+\.\d+)\b/);
  return m?.[1] ?? "4.18.2";
}

export function parseIncoming(raw: string, filename?: string): ParseResult {
  const text = raw.trim();
  const name = (filename ?? "").toLowerCase();

  let parsed: Record<string, unknown> | null = null;
  if (text.startsWith("{") || text.startsWith("[")) {
    try {
      parsed = JSON.parse(text) as Record<string, unknown>;
    } catch {
      parsed = null;
    }
  }

  const blob = `${name} ${text}`.toLowerCase();

  if (
    name.includes("snyk") ||
    blob.includes("hardcodedsecret") ||
    blob.includes("cve-") ||
    blob.includes('"rule"') ||
    /insecure|javascriptinterface|gitleaks|secret/i.test(text)
  ) {
    const file = String(parsed?.file ?? parsed?.path ?? "");
    const rule = String(parsed?.rule ?? parsed?.cve ?? "scanner");
    return {
      title: file ? `${rule} in ${file}` : firstLine(text),
      kind: "vuln",
      source: name.includes("snyk") || blob.includes("snyk") ? "snyk" : "manual",
      app: guessApp(text),
      platform: guessPlatform(text),
      appVersion: versionOf(text),
      raw: text,
      summary: "Security finding ingested from a scanner export or paste. Agent will classify; you still approve the ticket.",
      tags: ["vuln", "uploaded"],
      detected: "Security finding",
    };
  }

  if (
    /fluttererror|exception|anr|exc_bad_access|null check|rangeerror|segfault|fatal exception|stacktrace/i.test(text) ||
    name.includes("crash") ||
    name.includes("sentry")
  ) {
    const users = text.match(/sessions?[^\d]{0,12}(\d[\d,]*)/i);
    const n = users ? Number(users[1].replaceAll(",", "")) : 0;
    return {
      title: firstLine(text),
      kind: "crash",
      source: name.includes("sentry") || blob.includes("sentry") ? "sentry" : name.includes("crash") ? "crashlytics" : "manual",
      app: guessApp(text),
      platform: guessPlatform(text),
      appVersion: versionOf(text),
      raw: text,
      summary: n
        ? `Crash report pasted into the desk. ${n.toLocaleString()} sessions mentioned.`
        : "Crash report pasted into the desk. Agent will draft a ticket; nothing is filed until you approve.",
      tags: ["crash", "uploaded"],
      detected: "Crash / ANR",
    };
  }

  if (
    /review|rating|star|refund|paise|kat gaye|settlement|otp aane/i.test(text) ||
    name.endsWith(".csv") ||
    name.includes("review")
  ) {
    return {
      title: firstLine(text.replaceAll('"', "")),
      kind: "review",
      source: /ios|app.?store/i.test(text) ? "appstore" : "play_reviews",
      app: guessApp(text),
      platform: guessPlatform(text),
      appVersion: versionOf(text),
      raw: text,
      summary: "Store review or support cluster. Agent will decide if this is a client bug or a backend/support issue.",
      tags: ["reviews", "uploaded"],
      detected: "Review / support cluster",
    };
  }

  return {
    title: firstLine(text) || "Manual signal",
    kind: "crash",
    source: "manual",
    app: "consumer",
    platform: "both",
    appVersion: versionOf(text),
    raw: text,
    summary: "Free-form signal. Agent will classify from the text you pasted.",
    tags: ["manual"],
    detected: "Free-form note",
  };
}

export const SAMPLE_CRASH = `FlutterError: Null check operator used on a null value
#0  CheckoutSheetState._confirm (checkout_sheet.dart:188)
#1  CheckoutSheetState._onPay (checkout_sheet.dart:141)
app: nivapay 4.18.3 (build 41830)
os: Android 15 · Pixel 8
sessions_affected: 640
breadcrumb: POST https://api.nivapay.in/v3/checkout → 200 { "methods": [] }`;

export const SAMPLE_VULN = `{
  "tool": "snyk-code",
  "rule": "HardcodedSecret",
  "severity": "high",
  "file": "lib/src/config/stripe.ts",
  "line": 9,
  "snippet": "export const STRIPE_KEY = 'sk_live_51Niva••••';",
  "repo": "nivapay/nivapay-app"
}`;

export const SAMPLE_REVIEW = `rating,text,version,count
1,"Paise kat gaye, refund 3 din se nahi aaya. Order NP99102",4.18.3,28
1,"App hangs on merchant QR after update",2.9.1,11`;

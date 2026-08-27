// ============================================================
// Next.js instrumentation (M07C) — minimal, server-side Sentry init.
//
// Runs once at server boot (Node + Edge runtimes). Sentry is initialised
// ONLY when `SENTRY_DSN` is set, so with no DSN this is a strict no-op and
// local dev / self-host pull in no monitoring.
//
// Deliberately minimal & PII-safe:
//   - errors only: `tracesSampleRate: 0` (no performance tracing overhead),
//   - `sendDefaultPii: false` — Sentry never auto-attaches request headers,
//     cookies, IP, or bodies,
//   - no client/browser SDK, no Session Replay, no source-map upload
//     (`SENTRY_AUTH_TOKEN` / withSentryConfig are intentionally out of M07C).
//
// The seam in `src/lib/observability/sentry.ts` forwards to this SDK; both
// gate on `SENTRY_DSN`.
// ============================================================

import * as Sentry from '@sentry/nextjs'

export async function register() {
  if (!process.env.SENTRY_DSN) return

  // Same minimal options for both server runtimes.
  if (
    process.env.NEXT_RUNTIME === 'nodejs' ||
    process.env.NEXT_RUNTIME === 'edge'
  ) {
    Sentry.init({
      dsn: process.env.SENTRY_DSN,
      tracesSampleRate: 0,
      sendDefaultPii: false,
    })
  }
}

// Capture errors thrown in server components / route handlers / RSC. A safe
// no-op until `Sentry.init` has run (i.e. when no DSN is configured).
export const onRequestError = Sentry.captureRequestError

/**
 * Error-monitoring seam (Sentry) — wired in M07C.
 *
 * Env-flagged: when `SENTRY_DSN` is unset this is a strict no-op, so local
 * dev / self-host need no Sentry account (the SDK is imported but never
 * initialised — its capture calls are safe no-ops until `Sentry.init` runs
 * in `src/instrumentation.ts`, which only runs when the DSN is present).
 *
 * `SENTRY_DSN` is a SERVER-only var (no `NEXT_PUBLIC_` prefix), so
 * `isSentryEnabled()` is false in the browser — this seam therefore
 * forwards to Sentry only on the server. That is intentional: M07C is a
 * minimal, server-side-safe integration (no client bundle, no Replay, no
 * tracing overhead, no source-map upload). See docs/observability/README.md.
 *
 * PII: init sets `sendDefaultPii: false` (no request headers/cookies/IP/
 * body auto-captured); any `context` passed here is additionally run
 * through the shared PII denylist before it becomes Sentry `extra`.
 */

import * as Sentry from '@sentry/nextjs'

import { sanitizeProps } from './redact'

/** True when a Sentry DSN is provisioned (server-only var). */
export function isSentryEnabled(): boolean {
  return Boolean(process.env.SENTRY_DSN)
}

/** Report an error. No-op when Sentry is not configured. */
export function captureException(
  error: unknown,
  context?: Record<string, unknown>,
): void {
  if (!isSentryEnabled()) return
  Sentry.captureException(
    error,
    context ? { extra: sanitizeProps(context) } : undefined,
  )
}

/** Report a non-error message/breadcrumb. No-op when not configured. */
export function captureMessage(
  message: string,
  context?: Record<string, unknown>,
): void {
  if (!isSentryEnabled()) return
  Sentry.captureMessage(message, {
    level: 'info',
    ...(context ? { extra: sanitizeProps(context) } : {}),
  })
}

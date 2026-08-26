/**
 * Error-monitoring seam (Sentry foundation).
 *
 * Dependency-free and env-flagged. When `SENTRY_DSN` is unset this is a
 * strict no-op, so local development and self-host deploys need no Sentry
 * account and pull in no SDK. When `SENTRY_DSN` is set, failures are
 * emitted to `console.error` with a `[sentry]` marker (captured by
 * Vercel's log drains) — and this is the single, obvious place to forward
 * to `@sentry/nextjs` once that SDK is installed and verified against
 * Next 16 (a later step; see `docs/observability/README.md`).
 *
 * Intentionally minimal for M01: no release pipeline, no source-map
 * upload. This is a foundation to adopt at call sites incrementally, not a
 * full integration.
 */

/** True when a Sentry DSN is provisioned. */
export function isSentryEnabled(): boolean {
  return Boolean(process.env.SENTRY_DSN)
}

/** Report an error. No-op when Sentry is not configured. */
export function captureException(
  error: unknown,
  context?: Record<string, unknown>,
): void {
  if (!isSentryEnabled()) return
  // SEAM: forward to Sentry here once @sentry/nextjs is wired in.
  console.error('[sentry] captureException', error, context ?? {})
}

/** Report a non-error message/breadcrumb. No-op when not configured. */
export function captureMessage(
  message: string,
  context?: Record<string, unknown>,
): void {
  if (!isSentryEnabled()) return
  // SEAM: forward to Sentry here once @sentry/nextjs is wired in.
  console.warn('[sentry] captureMessage', message, context ?? {})
}

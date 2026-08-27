/**
 * Product-analytics seam (PostHog, server-side) — wired in M07C.
 *
 * Env-flagged: strict no-op when `NEXT_PUBLIC_POSTHOG_KEY` is unset, so
 * local dev / self-host need no PostHog account. When set, events are
 * forwarded via `posthog-node` (SERVER-side only in M07C — no browser
 * provider). Delivery is non-blocking: `capture()` enqueues and flushes in
 * the background, so a request never waits on analytics.
 *
 * ENV CONTRACT (deliberately unchanged): the seam keeps gating on
 * `NEXT_PUBLIC_POSTHOG_KEY`. A PostHog *project* API key (`phc_…`) is a
 * public ingestion key by design — it is embedded in browsers on every
 * PostHog setup — so it is NOT a secret, and using it server-side needs no
 * separate server-only variable. Keeping the existing var preserves
 * backward compatibility with the M01 seam. (Personal/private PostHog API
 * keys are a different thing and are never used here.)
 *
 * PRIVACY: `sanitizeProps` (shared denylist) strips sensitive property keys
 * from every event before it leaves the app — the CALLER is still
 * responsible for not passing PII in the first place.
 */

import { PostHog } from 'posthog-node'

import { sanitizeProps } from './redact'

let client: PostHog | null = null
let initialized = false

/** True when a PostHog project key is provisioned. */
export function isAnalyticsEnabled(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_POSTHOG_KEY)
}

/** Lazily build the shared PostHog client (only once, only when enabled). */
function getClient(): PostHog | null {
  if (!isAnalyticsEnabled()) return null
  if (!initialized) {
    initialized = true
    client = new PostHog(process.env.NEXT_PUBLIC_POSTHOG_KEY as string, {
      host: process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com',
    })
  }
  return client
}

/**
 * Record a product event. No-op when analytics is not configured.
 *
 * Properties are sanitized before leaving the app. A `distinct_id` property
 * (if present) is used as the PostHog distinct id and is not itself sent as
 * a property; absent one, events attribute to `'backend'`.
 */
export function captureEvent(
  event: string,
  props: Record<string, unknown> = {},
): void {
  const posthog = getClient()
  if (!posthog) return
  const { distinct_id, ...rest } = props
  posthog.capture({
    distinctId:
      typeof distinct_id === 'string' && distinct_id ? distinct_id : 'backend',
    event,
    properties: sanitizeProps(rest),
  })
}

/** Re-export so existing callers/tests importing from here keep working. */
export { sanitizeProps } from './redact'

/** Test-only: drop the memoized client so env changes take effect between
 *  tests. Not used in production code. */
export function __resetAnalyticsForTests(): void {
  client = null
  initialized = false
}

/**
 * Product-analytics seam (PostHog foundation).
 *
 * Dependency-free and env-flagged. Strict no-op when
 * `NEXT_PUBLIC_POSTHOG_KEY` is unset, so local dev / self-host need no
 * PostHog account and no SDK. When set, events are emitted to
 * `console.info` with a `[posthog]` marker — the single seam for wiring
 * `posthog-node` (server) / `posthog-js` (client) later; see
 * `docs/observability/README.md`.
 *
 * PRIVACY (critical for a WhatsApp product): never pass message content,
 * phone numbers, access tokens, or customer PII as event names or
 * properties. `captureEvent` strips a denylist of obviously-sensitive
 * property keys as defense-in-depth, but the CALLER is responsible for
 * not sending PII in the first place. Prefer coarse, non-identifying
 * events, e.g. `captureEvent('campaign_created', { recipient_count: 250 })`.
 */

/** Property keys that must never leave the app as analytics data. Matched
 *  case-insensitively as a substring, so `customer_phone`, `authToken`,
 *  `message_body`, etc. are all dropped. */
const SENSITIVE_KEY =
  /(phone|msisdn|whatsapp|token|secret|password|api[_-]?key|message|body|content|text|email|address|name|contact)/i

/** True when a PostHog project key is provisioned. */
export function isAnalyticsEnabled(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_POSTHOG_KEY)
}

/** Drop denylisted (potentially sensitive) property keys. Exported for
 *  testing and for callers that want to pre-sanitize. */
export function sanitizeProps(
  props: Record<string, unknown>,
): Record<string, unknown> {
  const out: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(props)) {
    if (SENSITIVE_KEY.test(key)) continue
    out[key] = value
  }
  return out
}

/**
 * Record a product event. No-op when analytics is not configured.
 * Properties are sanitized (see `sanitizeProps`) before leaving the app.
 */
export function captureEvent(
  event: string,
  props: Record<string, unknown> = {},
): void {
  if (!isAnalyticsEnabled()) return
  // SEAM: forward to PostHog here once the SDK is wired in.
  console.info('[posthog] capture', event, sanitizeProps(props))
}

/**
 * Shared PII/secret redaction for observability (M07C).
 *
 * Single source of truth for the denylist, used by BOTH the analytics
 * (PostHog) and error-monitoring (Sentry) seams so nothing sensitive leaves
 * the app as event properties or error context. Pure and dependency-free —
 * it must not pull the SDKs into either seam's module graph.
 *
 * This is defense-in-depth, not a licence to pass PII: callers should send
 * coarse, non-identifying data. Sentry's own request-data capture is
 * additionally disabled via `sendDefaultPii: false` at init.
 */

/** Property keys that must never leave the app. Matched case-insensitively
 *  as a substring, so `customer_phone`, `authToken`, `message_body`, etc.
 *  are all dropped. */
export const SENSITIVE_KEY =
  /(phone|msisdn|whatsapp|token|secret|password|api[_-]?key|message|body|content|text|email|address|name|contact)/i

/** Drop denylisted (potentially sensitive) property keys. */
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

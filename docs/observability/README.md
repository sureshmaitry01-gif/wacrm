# Observability (Sentry + PostHog)

Env-flagged error monitoring + product analytics. Introduced as
dependency-free seams in **M01**; **wired to the real SDKs in M07C**
(server-side only).

> Everything here is **no-op when its env var is unset**. Local dev and
> self-host need no Sentry/PostHog account — the SDKs are installed but
> never initialised without the env vars.

## Modules

`src/lib/observability/`:

- **`sentry.ts`** — `captureException(err, ctx?)`, `captureMessage(msg, ctx?)`,
  `isSentryEnabled()`. No-op unless `SENTRY_DSN` (server-only var) is set;
  when set, forwards to `@sentry/nextjs`. `ctx` is PII-scrubbed (shared
  denylist) before becoming Sentry `extra`.
- **`analytics.ts`** — `captureEvent(event, props?)`, `isAnalyticsEnabled()`.
  No-op unless `NEXT_PUBLIC_POSTHOG_KEY` is set; when set, forwards to
  `posthog-node` (server-side, non-blocking). A `distinct_id` prop sets the
  PostHog id; every event is `sanitizeProps`-scrubbed.
- **`redact.ts`** — the shared PII denylist + `sanitizeProps` (used by both
  seams; pure, pulls in no SDK).
- **`index.ts`** — re-exports the public surface.

Init lives in **`src/instrumentation.ts`** (`Sentry.init`, server + edge,
errors-only, `sendDefaultPii: false`) — runs only when `SENTRY_DSN` is set.

Import from `@/lib/observability`.

### Scope (M07C) — server-side only

No browser SDK, no Session Replay, no tracing (`tracesSampleRate: 0`), no
source-map upload (`SENTRY_AUTH_TOKEN`/`withSentryConfig` deferred). Because
neither integration makes a *client* network call, `next.config.ts`'s CSP
`connect-src` needed no change. `SENTRY_DSN` is server-only, so the Sentry
seam is inert in the browser by construction. The PostHog project key
(`phc_…`) is a public ingestion key by design, so using
`NEXT_PUBLIC_POSTHOG_KEY` server-side needs no separate secret var — the
env contract is unchanged from M01.

## Privacy (read before adding any analytics)

This is a WhatsApp product; message data and contact identifiers are
sensitive. **Never** pass to analytics:

- message content / body / text
- phone numbers (MSISDN) or WhatsApp IDs
- access tokens, secrets, API keys
- customer names, emails, addresses — any PII

`captureEvent` strips a denylist of sensitive property keys
(`sanitizeProps`) as defense-in-depth, but that is a backstop, **not**
permission to send PII. Prefer coarse, non-identifying events:

```ts
import { captureEvent } from '@/lib/observability'
captureEvent('campaign_created', { recipient_count: 250, has_media: true })
```

Sentry contexts are subject to the same rule — attach ids/route names, not
message bodies or tokens.

## Completing the wiring (later)

The seams are the single place to plug in the real SDKs once verified
against Next.js 16 (see [AGENTS.md](../../AGENTS.md) — this is not the
Next.js your training data knows):

1. **Sentry** — install `@sentry/nextjs`, add the standard
   `instrumentation.ts` / client+server configs, and forward from the
   `SEAM:` comments in `sentry.ts`. Keep it guarded by `isSentryEnabled()`.
   Defer release-pipeline / source-map upload (`SENTRY_AUTH_TOKEN`) until
   CI is ready.
2. **PostHog** — install `posthog-node` (server) and/or `posthog-js`
   (client behind a provider), forward from the `SEAM:` comment in
   `analytics.ts`, and keep `sanitizeProps` in the path.

Until then the foundation is safe to call anywhere: it simply does nothing
when unconfigured, and structured-logs when configured.

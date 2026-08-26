# Observability foundation (Sentry + PostHog)

Milestone **M01** adds a dependency-free, env-flagged **foundation** for
error monitoring and product analytics. These are seams to adopt
incrementally — not full integrations, and deliberately not yet wired into
existing product code (M01 changes no product behavior).

> Everything here is **no-op when its env var is unset**. Local dev and
> self-host need no Sentry/PostHog account and pull in no SDK.

## Modules

`src/lib/observability/`:

- **`sentry.ts`** — `captureException(err, ctx?)`, `captureMessage(msg, ctx?)`,
  `isSentryEnabled()`. No-op unless `SENTRY_DSN` is set; when set, emits a
  `[sentry]`-marked `console.error/warn` (captured by Vercel log drains).
- **`analytics.ts`** — `captureEvent(event, props?)`, `sanitizeProps(props)`,
  `isAnalyticsEnabled()`. No-op unless `NEXT_PUBLIC_POSTHOG_KEY` is set;
  when set, emits a `[posthog]`-marked `console.info`.
- **`index.ts`** — re-exports both.

Import from `@/lib/observability`.

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

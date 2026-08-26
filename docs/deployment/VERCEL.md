# Deploying on Vercel

Target production deployment for the hosted SaaS is **Vercel + Supabase**.
This doc covers env vars, cron wiring, and the serverless considerations
hardened in milestone **M01**. (Upstream Hostinger/self-host docs remain
valid for self-hosters but are not our production path — see
[../conversion/SAAS_POSITIONING.md](../conversion/SAAS_POSITIONING.md).)

> Status: deployment **foundation**. This documents the config and the
> M01 hardening; a full production cutover (custom domain, Meta webhook
> repoint, load test) happens when we actually stand up the hosted env.

## 1. Environment variables

Set these in the Vercel dashboard (Project → Settings → Environment
Variables), scoped to Production/Preview as appropriate.

### Required (existing — unchanged from the base)
| Var | Notes |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-only; bypasses RLS (webhook, cron, public-API auth) |
| `ENCRYPTION_KEY` | 64 hex chars; AES-256-GCM for WhatsApp/AI tokens |
| `META_APP_SECRET` | Verifies inbound webhook HMAC |

### Recommended
| Var | Notes |
|---|---|
| `NEXT_PUBLIC_SITE_URL` | Canonical URL (scheme+host, no trailing slash) |
| `NEXT_PUBLIC_APP_LOCALE` | Default locale |

### Cron (see §3)
| Var | Notes |
|---|---|
| `CRON_SECRET` | Vercel Cron injects `Authorization: Bearer <CRON_SECRET>`. Set this to enable native crons. |
| `AUTOMATION_CRON_SECRET` | Alternative `x-cron-secret` header credential (external pingers). Either authorizes cron. |

### M01 hardening / monitoring (all no-op when unset)
| Var | Purpose |
|---|---|
| `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` | Distributed rate limiting (see §2). |
| `SENTRY_DSN` | Error monitoring seam (foundation). |
| `NEXT_PUBLIC_POSTHOG_KEY`, `NEXT_PUBLIC_POSTHOG_HOST` | Product analytics seam (foundation). |

Future milestones add `DEEPSEEK_*` (M03), `DODO_*` (M02), `RESEND_API_KEY`
(M01/M02) — documented as commented placeholders in `.env.local.example`,
not wired yet.

## 2. Rate limiting on serverless (M01)

The base shipped an in-memory limiter (`src/lib/rate-limit.ts`). On Vercel,
each serverless invocation can be a fresh process, so an in-memory Map does
**not** enforce a shared limit — it was effectively absent in a fan-out
deploy.

M01 makes the limiter backend-aware:

- **Upstash Redis** is used automatically when **both**
  `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` are set. It's a
  fixed-window counter in Redis over the Upstash REST API (`fetch` — **no
  SDK dependency**), so the limit holds across every invocation/region.
- **In-memory** is used when Upstash is unset (local dev / self-host) or as
  a **fail-open fallback** if an Upstash call errors or times out.

The public `checkRateLimit(key, opts)` is now `async` but returns the same
`RateLimitResult`; call sites only add `await`. **Set the Upstash vars in
production**; leave them unset locally.

## 3. Cron jobs (M01)

Two endpoints must run on a schedule:

- `GET /api/automations/cron` — drains due automation Wait steps.
- `GET /api/flows/cron` — sweeps abandoned/timed-out flow runs (also frees
  the one-active-run-per-contact index).

[`vercel.json`](../../vercel.json) declares native Vercel Cron schedules:

```json
{
  "crons": [
    { "path": "/api/automations/cron", "schedule": "*/5 * * * *" },
    { "path": "/api/flows/cron", "schedule": "0 * * * *" }
  ]
}
```

**Auth model.** Vercel Cron cannot send custom headers; it sends
`Authorization: Bearer <CRON_SECRET>`. The base only checked a custom
`x-cron-secret` header, so M01 added a shared, tested helper
(`src/lib/cron/auth.ts`) that accepts **either**:

1. `x-cron-secret: <AUTOMATION_CRON_SECRET>` (external pingers / self-host — unchanged), or
2. `Authorization: Bearer <CRON_SECRET>` (Vercel Cron).

To enable native crons, set **`CRON_SECRET`** in Vercel. When no secret is
provisioned at all, the endpoints return `503 cron not configured` (prior
behaviour preserved).

**Plan note.** Minute-granular crons (`*/5 * * * *`) require a Vercel plan
that supports frequent cron schedules (Pro+). On the Hobby plan cron
frequency is limited — for local/dev you can keep hitting the endpoints
with an external pinger using `AUTOMATION_CRON_SECRET` instead.

## 4. Serverless risk review — broadcast / campaign sending (M01)

**Finding: no code change required in M01.** The send paths are already
serverless-aware:

- Broadcast fan-out runs in `after()` and each route declares an explicit
  `export const maxDuration` — `/api/whatsapp/broadcast/[id]/resume` = 300s,
  the inbound webhook and `/api/v1/broadcasts` = 60s. On Vercel these map to
  the function timeout (300s requires Pro+).
- Durability already exists: migration `038_broadcast_resume` + the
  `/api/whatsapp/broadcast/[id]/resume` endpoint + `broadcast-resume.ts`
  let a partially-sent broadcast be continued, so a fan-out that exceeds
  one function's timeout is recoverable rather than lost.

**Recommendation.** A cron-drained durable queue is **postponed** (revisit
at **M07 — scale hardening**), consistent with the M00A audit. If very
large campaigns routinely exceed `maxDuration` on our chosen plan, the
lowest-risk next step is a scheduled auto-resume (a Vercel Cron that calls
resume for broadcasts stuck in `sending`), not a rewrite of the send
system. **Do not rewrite the campaign system in M01.**

## 5. Not done yet (future)

- Custom domain + Meta webhook repoint to the Vercel URL.
- `@sentry/nextjs` / PostHog SDK wiring (foundations only today — see
  [../observability/README.md](../observability/README.md)).
- Load/throughput testing against Meta messaging tiers.

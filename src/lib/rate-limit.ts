/**
 * Per-key rate limiter with two backends.
 *
 * Backend selection is automatic, per call:
 *
 *   • Upstash Redis (production / Vercel) — used when BOTH
 *     `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` are set.
 *     A fixed-window counter kept in Redis, so the limit holds across
 *     every serverless invocation / region — the in-memory Map below is
 *     defeated by Vercel's serverless fan-out (each invocation may be a
 *     fresh process), which is exactly why this backend exists.
 *
 *   • In-memory Map (local dev / self-host / fallback) — used when the
 *     Upstash env vars are absent, OR when an Upstash call fails. This is
 *     the original single-process fixed-window limiter; it is correct for
 *     a single instance and keeps local development working with zero
 *     external services.
 *
 * Fail-open: if Upstash is configured but the request errors or times out,
 * we fall back to the in-memory limiter rather than blocking the user. A
 * limiter outage should degrade protection, not take down the app.
 *
 * Public API: `checkRateLimit` is async (a network backend is inherently
 * async). The return shape (`RateLimitResult`) is unchanged, so call sites
 * only add `await`. The in-memory path is exposed as
 * `checkRateLimitInMemory` for deterministic unit tests and as the shared
 * fallback.
 */

import { NextResponse } from 'next/server';

export interface RateLimitOptions {
  /** Max requests allowed in `windowMs`. */
  limit: number;
  /** Window size, milliseconds. */
  windowMs: number;
}

export interface RateLimitResult {
  success: boolean;
  /** Requests still allowed in the current window. */
  remaining: number;
  /** Unix ms when the bucket refills. */
  reset: number;
  limit: number;
}

// ============================================================
// In-memory backend (local dev / self-host / fallback)
// ============================================================

interface Entry {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, Entry>();

// Opportunistic cleanup. Running a sweep on every call would be
// quadratic; running it 1-in-N lets the Map self-drain without a
// background timer.
const LIGHT_SWEEP_EVERY = 1000;
let callsSinceSweep = 0;

function sweepExpired(now: number) {
  for (const [k, v] of buckets) {
    if (v.resetAt <= now) buckets.delete(k);
  }
}

/**
 * Single-process fixed-window counter. Synchronous and dependency-free.
 * Used directly in local dev / self-host and as the fallback when an
 * Upstash call can't be made. Its behaviour is identical to the limiter
 * this module shipped with before the Upstash backend was added.
 */
export function checkRateLimitInMemory(
  key: string,
  { limit, windowMs }: RateLimitOptions,
): RateLimitResult {
  const now = Date.now();

  callsSinceSweep += 1;
  if (callsSinceSweep >= LIGHT_SWEEP_EVERY) {
    callsSinceSweep = 0;
    sweepExpired(now);
  }

  const entry = buckets.get(key);

  if (!entry || entry.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { success: true, remaining: limit - 1, reset: now + windowMs, limit };
  }

  if (entry.count >= limit) {
    return { success: false, remaining: 0, reset: entry.resetAt, limit };
  }

  entry.count += 1;
  return {
    success: true,
    remaining: limit - entry.count,
    reset: entry.resetAt,
    limit,
  };
}

// ============================================================
// Upstash Redis backend (production / Vercel)
// ============================================================

/** Keep the limiter fast: a slow Redis must never dominate request
 *  latency. On timeout we fail open to the in-memory backend. */
const UPSTASH_TIMEOUT_MS = 1500;

/** True when both Upstash REST env vars are present. Exposed so callers /
 *  health checks can report which backend is active. */
export function isUpstashConfigured(): boolean {
  return Boolean(
    process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN,
  );
}

/**
 * Fixed-window counter in Redis via the Upstash REST API — no SDK, just
 * `fetch`, so there is no hard dependency and nothing to install for local
 * dev.
 *
 * The key is stamped with the window id (`floor(now / windowMs)`) so each
 * window is a distinct Redis key that expires on its own; no branching /
 * Lua needed. One pipelined round trip:
 *   INCR   rl:<key>:<windowId>        → current count in this window
 *   PEXPIRE rl:<key>:<windowId> <ms>  → self-cleaning TTL
 *
 * Returns `null` (never throws) when Upstash isn't configured or the call
 * fails, signalling the caller to fall back to the in-memory backend.
 */
async function checkUpstash(
  key: string,
  { limit, windowMs }: RateLimitOptions,
): Promise<RateLimitResult | null> {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;

  const now = Date.now();
  const windowId = Math.floor(now / windowMs);
  const redisKey = `rl:${key}:${windowId}`;
  const reset = (windowId + 1) * windowMs;

  try {
    const res = await fetch(`${url.replace(/\/$/, '')}/pipeline`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify([
        ['INCR', redisKey],
        ['PEXPIRE', redisKey, String(windowMs)],
      ]),
      signal: AbortSignal.timeout(UPSTASH_TIMEOUT_MS),
      cache: 'no-store',
    });

    if (!res.ok) return null;

    // Pipeline response: [{ result: <count> }, { result: 1 }].
    const data = (await res.json().catch(() => null)) as
      | { result?: unknown; error?: unknown }[]
      | null;
    const count = Number(data?.[0]?.result);
    if (!Number.isFinite(count)) return null;

    return {
      success: count <= limit,
      remaining: Math.max(0, limit - count),
      reset,
      limit,
    };
  } catch {
    // Network error / timeout / abort — fail open to in-memory.
    return null;
  }
}

// ============================================================
// Public entry point
// ============================================================

/**
 * Check (and consume) one unit of the budget for `key`.
 *
 * Uses the Upstash backend when configured; otherwise, or on any Upstash
 * failure, uses the in-memory backend. Always resolves to a
 * `RateLimitResult` — never rejects.
 */
export async function checkRateLimit(
  key: string,
  opts: RateLimitOptions,
): Promise<RateLimitResult> {
  const viaUpstash = await checkUpstash(key, opts);
  if (viaUpstash) return viaUpstash;
  return checkRateLimitInMemory(key, opts);
}

/**
 * Standard 429 response with the headers clients expect (RFC 6585 +
 * draft-ietf-httpapi-ratelimit-headers). Callers just `return` this.
 */
export function rateLimitResponse(result: RateLimitResult): NextResponse {
  const retryAfterSec = Math.max(1, Math.ceil((result.reset - Date.now()) / 1000));
  return NextResponse.json(
    {
      error: 'Rate limit exceeded',
      retry_after_seconds: retryAfterSec,
    },
    {
      status: 429,
      headers: {
        'Retry-After': String(retryAfterSec),
        'X-RateLimit-Limit': String(result.limit),
        'X-RateLimit-Remaining': String(result.remaining),
        'X-RateLimit-Reset': String(Math.ceil(result.reset / 1000)),
      },
    },
  );
}

/** Preconfigured budgets, tweak here not at call sites. */
export const RATE_LIMITS = {
  /** Individual message send. 60/min per user = one per second
   *  sustained, comfortable for a live human typing. */
  send: { limit: 60, windowMs: 60_000 },
  /** Broadcast dispatch. NOT one call per campaign: the wizard fans a
   *  campaign out over `/api/whatsapp/broadcast` in batches of 10
   *  recipients, roughly one call every 1–2 s, so a 1 000-recipient
   *  send is ~100 calls over several minutes. This bucket was 5/min on
   *  the assumption of one call per campaign, which meant everything
   *  past the first ~50 recipients came back 429 and was recorded as a
   *  failed recipient (issue #472). 60/min per user carries the wizard's
   *  pacing with headroom while still bounding a script in a loop;
   *  Meta's own per-number limits remain the real throughput ceiling. */
  broadcast: { limit: 60, windowMs: 60_000 },
  /** Reaction add/swap/remove. More permissive than send — users
   *  fidget with reactions and a single "swap" is actually two calls
   *  (remove + add) under the hood. */
  react: { limit: 120, windowMs: 60_000 },
  /** Invitation peek (public, per-IP). 30/min lets a forwarded link
   *  retry a handful of times under flaky connectivity without
   *  enabling brute-force token enumeration. With 256-bit tokens the
   *  enumeration risk is theoretical; this is belt-and-braces. */
  invitationPeek: { limit: 30, windowMs: 60_000 },
  /** Invitation redeem (authed, per-IP+user). Tighter than peek —
   *  successful redemption mutates two profiles and an invite row, so
   *  the abuse surface is "spam join attempts." */
  invitationRedeem: { limit: 10, windowMs: 60_000 },
  /** Admin-only account / member-management actions: create/revoke
   *  invitation, rename account, change member role, remove member,
   *  transfer ownership. 30/min per user is comfortably above any
   *  realistic legitimate use (the Members tab is a clicks-only UI)
   *  while still bounding accidental abuse from a script run in a
   *  loop or a compromised admin session spamming role flips. */
  adminAction: { limit: 30, windowMs: 60_000 },
  /** Public REST API (`/api/v1/*`), keyed per API key. 120/min ≈ 2
   *  req/s sustained — comfortable for a polling integration or an
   *  automation firing on inbound events, while bounding a runaway
   *  script. With the Upstash backend this now holds across a
   *  multi-instance / serverless deploy, not just per process. */
  publicApi: { limit: 120, windowMs: 60_000 },
  /** AI draft-reply generation, per user. 20/min is generous for an
   *  agent clicking "Draft with AI" while working a thread, and bounds
   *  spend on the account's own LLM key against an accidental
   *  hold-down / script. */
  aiDraft: { limit: 20, windowMs: 60_000 },
  /** AI draft-reply generation, per account. Caps the WHOLE team's
   *  draws on the one shared BYO provider key — without this, N agents
   *  each under their per-user limit could still stampede the account's
   *  key past the provider's own rate limit. 60/min ≈ three busy agents
   *  drafting flat-out. */
  aiDraftAccount: { limit: 60, windowMs: 60_000 },
  /** AI auto-reply generation, per account. The per-conversation cap
   *  (`auto_reply_max_per_conversation`) bounds one thread; this bounds
   *  the whole account across threads, so a burst of inbound from many
   *  customers at once can't run the BYO key past the provider's limit
   *  or the owner's budget. 30/min is generous for organic inbound while
   *  capping a stampede; excess inbounds simply don't get an auto-reply
   *  (they still land in the inbox for a human). */
  aiAutoReplyAccount: { limit: 30, windowMs: 60_000 },
} as const;

/** Test-only helper. Clears the in-memory state so unit tests don't
 *  leak buckets across files. Not wired up in production code. */
export function __resetRateLimitForTests() {
  buckets.clear();
  callsSinceSweep = 0;
}

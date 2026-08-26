import { timingSafeEqual } from 'node:crypto'

export interface CronAuthResult {
  ok: boolean
  /** HTTP status to return when not ok: 503 (no secret provisioned) or
   *  401 (a secret is provisioned but the request didn't match). */
  status?: 401 | 503
  error?: string
}

/** Constant-time string compare. Length mismatch short-circuits (the
 *  length itself isn't sensitive; `timingSafeEqual` throws on unequal
 *  lengths). */
function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a)
  const bb = Buffer.from(b)
  if (ab.length !== bb.length) return false
  return timingSafeEqual(ab, bb)
}

/**
 * Authorize a scheduled cron invocation against a shared secret.
 *
 * Accepts EITHER credential, so the same endpoint works under a
 * self-hosted external pinger AND native Vercel Cron:
 *
 *   1. `x-cron-secret: <AUTOMATION_CRON_SECRET>` — the original header,
 *      used by external pingers / GitHub Actions / self-host deploys.
 *   2. `Authorization: Bearer <CRON_SECRET>` — Vercel Cron injects this
 *      automatically from the `CRON_SECRET` env var. Vercel Cron cannot be
 *      configured to send custom headers, so this is how it authenticates.
 *
 * Returns `{ ok:true }` when a supplied credential matches a provisioned
 * secret. When NO secret is provisioned at all (neither env var set) →
 * `{ ok:false, status:503 }` ("cron not configured"), preserving the
 * routes' prior behaviour. Otherwise → `{ ok:false, status:401 }`.
 *
 * Backward-compatible: the `x-cron-secret` path behaves exactly as before;
 * the bearer path is purely additive for Vercel Cron.
 */
export function authorizeCronRequest(request: Request): CronAuthResult {
  const headerSecret = process.env.AUTOMATION_CRON_SECRET
  const bearerSecret = process.env.CRON_SECRET

  if (!headerSecret && !bearerSecret) {
    return { ok: false, status: 503, error: 'cron not configured' }
  }

  // Existing header credential.
  const suppliedHeader = request.headers.get('x-cron-secret') ?? ''
  if (headerSecret && suppliedHeader && safeEqual(suppliedHeader, headerSecret)) {
    return { ok: true }
  }

  // Vercel Cron bearer credential.
  const auth = request.headers.get('authorization') ?? ''
  const suppliedBearer = auth.startsWith('Bearer ') ? auth.slice(7) : ''
  if (bearerSecret && suppliedBearer && safeEqual(suppliedBearer, bearerSecret)) {
    return { ok: true }
  }

  return { ok: false, status: 401, error: 'Unauthorized' }
}

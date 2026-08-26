import { describe, expect, it, vi } from 'vitest'
import type { SupabaseClient } from '@supabase/supabase-js'

import {
  consumeQuota,
  getAccountEntitlements,
  hasFeature,
  upgradeRequiredResponse,
} from './entitlements'
import { PLAN_CATALOG } from './plans'

/**
 * Minimal fake of the PostgREST builder chain used by the module:
 *   db.from(t).select(...).eq(...).eq(...).maybeSingle()
 * plus db.rpc(). Each table returns whatever the fixture supplies.
 */
function fakeDb(opts: {
  subscription?: Record<string, unknown> | null
  entitlements?: Record<string, unknown> | null
  rpc?: { data?: unknown; error?: { message: string } | null }
}): SupabaseClient {
  const rows: Record<string, unknown> = {
    subscriptions: opts.subscription ?? null,
    entitlements: opts.entitlements ?? null,
  }
  const chain = (table: string) => {
    const builder: Record<string, unknown> = {}
    const self = () => builder
    builder.select = self
    builder.eq = self
    builder.maybeSingle = async () => ({ data: rows[table] ?? null, error: null })
    return builder
  }
  return {
    from: (table: string) => chain(table),
    rpc: vi.fn(async () => ({
      data: opts.rpc?.data ?? null,
      error: opts.rpc?.error ?? null,
    })),
  } as unknown as SupabaseClient
}

describe('getAccountEntitlements', () => {
  it('defaults to the free plan when no subscription row exists', async () => {
    const ent = await getAccountEntitlements(fakeDb({}), 'acc-1')
    expect(ent.planId).toBe('free')
    expect(ent.limits).toEqual(PLAN_CATALOG.free.limits)
  })

  it('resolves the plan limits for an active subscription', async () => {
    const ent = await getAccountEntitlements(
      fakeDb({ subscription: { plan_id: 'growth', status: 'active' } }),
      'acc-1',
    )
    expect(ent.planId).toBe('growth')
    expect(ent.active).toBe(true)
    expect(ent.limits.monthly_messages_limit).toBe(
      PLAN_CATALOG.growth.limits.monthly_messages_limit,
    )
  })

  it('treats trialing as entitled', async () => {
    const ent = await getAccountEntitlements(
      fakeDb({ subscription: { plan_id: 'starter', status: 'trialing' } }),
      'acc-1',
    )
    expect(ent.active).toBe(true)
    expect(ent.limits.contacts_limit).toBe(
      PLAN_CATALOG.starter.limits.contacts_limit,
    )
  })

  it('falls back to FREE limits when a paid subscription has lapsed', async () => {
    for (const status of ['on_hold', 'canceled', 'expired', 'failed']) {
      const ent = await getAccountEntitlements(
        fakeDb({ subscription: { plan_id: 'agency', status } }),
        'acc-1',
      )
      // plan_id still reports what they bought...
      expect(ent.planId).toBe('agency')
      // ...but enforcement drops to free.
      expect(ent.active).toBe(false)
      expect(ent.limits).toEqual(PLAN_CATALOG.free.limits)
    }
  })

  it('applies non-null entitlement overrides over the plan value', async () => {
    const ent = await getAccountEntitlements(
      fakeDb({
        subscription: { plan_id: 'starter', status: 'active' },
        entitlements: { monthly_messages_limit: 999_999, contacts_limit: null },
      }),
      'acc-1',
    )
    expect(ent.limits.monthly_messages_limit).toBe(999_999)
    // NULL override inherits the plan value.
    expect(ent.limits.contacts_limit).toBe(
      PLAN_CATALOG.starter.limits.contacts_limit,
    )
  })
})

describe('hasFeature', () => {
  it('reflects the effective plan flag', async () => {
    expect(
      await hasFeature(
        fakeDb({ subscription: { plan_id: 'growth', status: 'active' } }),
        'acc-1',
        'api_access_enabled',
      ),
    ).toBe(true)
    expect(
      await hasFeature(
        fakeDb({ subscription: { plan_id: 'free', status: 'active' } }),
        'acc-1',
        'api_access_enabled',
      ),
    ).toBe(false)
  })
})

describe('consumeQuota', () => {
  it('allows without an RPC round trip when the limit is unlimited', async () => {
    const db = fakeDb({ subscription: { plan_id: 'enterprise', status: 'active' } })
    const res = await consumeQuota(db, 'acc-1', 'monthly_messages_limit', 5)
    expect(res.allowed).toBe(true)
    expect(db.rpc).not.toHaveBeenCalled()
  })

  it('allows when the RPC reports room', async () => {
    const db = fakeDb({
      subscription: { plan_id: 'starter', status: 'active' },
      rpc: { data: [{ allowed: true, used: 10, quota_limit: 25_000 }] },
    })
    const res = await consumeQuota(db, 'acc-1', 'monthly_messages_limit', 10)
    expect(res.allowed).toBe(true)
    expect(res.used).toBe(10)
    expect(db.rpc).toHaveBeenCalledWith('consume_quota', {
      p_account_id: 'acc-1',
      p_metric: 'monthly_messages_limit',
      p_amount: 10,
      p_limit: PLAN_CATALOG.starter.limits.monthly_messages_limit,
    })
  })

  it('blocks when the RPC reports the quota is exhausted', async () => {
    const db = fakeDb({
      subscription: { plan_id: 'free', status: 'active' },
      rpc: { data: [{ allowed: false, used: 1000, quota_limit: 1000 }] },
    })
    const res = await consumeQuota(db, 'acc-1', 'monthly_messages_limit', 1)
    expect(res.allowed).toBe(false)
    expect(res.limit).toBe(1000)
  })

  it('FAILS OPEN when the RPC errors — billing must not break sending', async () => {
    const db = fakeDb({
      subscription: { plan_id: 'starter', status: 'active' },
      rpc: { error: { message: 'function does not exist' } },
    })
    const res = await consumeQuota(db, 'acc-1', 'monthly_messages_limit', 1)
    expect(res.allowed).toBe(true)
  })

  it('enforces the FREE limit for a lapsed paid plan', async () => {
    const db = fakeDb({
      subscription: { plan_id: 'agency', status: 'canceled' },
      rpc: { data: [{ allowed: false, used: 1000, quota_limit: 1000 }] },
    })
    await consumeQuota(db, 'acc-1', 'monthly_messages_limit', 1)
    expect(db.rpc).toHaveBeenCalledWith(
      'consume_quota',
      expect.objectContaining({
        p_limit: PLAN_CATALOG.free.limits.monthly_messages_limit,
      }),
    )
  })
})

describe('upgradeRequiredResponse', () => {
  it('returns a 402 carrying the metric, limit, and upgrade URL', async () => {
    const res = upgradeRequiredResponse({
      allowed: false,
      used: 1000,
      limit: 1000,
      planId: 'free',
      metric: 'monthly_messages_limit',
    })
    expect(res.status).toBe(402)
    const body = (await res.json()) as Record<string, unknown>
    expect(body.code).toBe('upgrade_required')
    expect(body.metric).toBe('monthly_messages_limit')
    expect(body.plan).toBe('free')
    expect(body.upgrade_url).toBe('/settings?tab=billing')
  })
})

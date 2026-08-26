import { NextResponse } from 'next/server'
import type { SupabaseClient } from '@supabase/supabase-js'

import {
  DEFAULT_PLAN_ID,
  getPlan,
  UNLIMITED,
  type BooleanLimitKey,
  type NumericLimitKey,
  type Plan,
  type PlanId,
  type PlanLimits,
} from './plans'
import type { SubscriptionStatus } from './types'

// ============================================================
// Entitlement resolution + quota gating.
//
// Resolution order for any limit:
//   1. `entitlements` row override for the account (non-NULL column), else
//   2. the plan catalog value for the account's current plan (plans.ts).
//
// Generic on purpose: contacts / broadcasts / messages / team / AI credits
// all flow through the same two helpers, so M03's AI metering and later
// contact/team caps reuse this without new machinery.
// ============================================================

/** Statuses that entitle an account to its paid plan's limits. A lapsed
 *  account (on_hold / canceled / expired / failed) falls back to the Free
 *  plan's limits rather than being hard-locked — retention over punishment;
 *  they keep read access and a reduced allowance. */
const ENTITLED_STATUSES: SubscriptionStatus[] = ['trialing', 'active']

export interface AccountEntitlements {
  planId: PlanId
  /** The plan actually being enforced (Free when the subscription lapsed). */
  effectivePlan: Plan
  status: SubscriptionStatus
  /** True when the subscription is in an entitled state. */
  active: boolean
  limits: PlanLimits
  currentPeriodEnd: string | null
}

interface SubscriptionRow {
  plan_id: string | null
  status: string | null
  current_period_end: string | null
}

type EntitlementOverrideRow = Partial<
  Record<keyof PlanLimits, number | boolean | null>
>

function isStatus(v: string | null): v is SubscriptionStatus {
  return (
    v === 'trialing' ||
    v === 'active' ||
    v === 'on_hold' ||
    v === 'canceled' ||
    v === 'expired' ||
    v === 'failed' ||
    v === 'incomplete'
  )
}

/**
 * Load the account's effective entitlements.
 *
 * Never throws on a missing row: an account with no subscription (or a DB
 * hiccup) resolves to the Free plan, so a billing outage degrades to the
 * free tier rather than blocking the product.
 *
 * Works with any client — the RLS-scoped SSR client from a route, or the
 * service-role admin client from a machine path.
 */
export async function getAccountEntitlements(
  db: SupabaseClient,
  accountId: string,
): Promise<AccountEntitlements> {
  const { data: subRow } = await db
    .from('subscriptions')
    .select('plan_id, status, current_period_end')
    .eq('account_id', accountId)
    .maybeSingle()

  const sub = (subRow ?? null) as SubscriptionRow | null
  const status: SubscriptionStatus = isStatus(sub?.status ?? null)
    ? (sub!.status as SubscriptionStatus)
    : 'trialing'
  const planId = getPlan(sub?.plan_id ?? DEFAULT_PLAN_ID).id
  const active = ENTITLED_STATUSES.includes(status)

  // A lapsed subscription drops to Free-plan limits.
  const effectivePlan = active ? getPlan(planId) : getPlan(DEFAULT_PLAN_ID)

  const { data: overrideRow } = await db
    .from('entitlements')
    .select(
      'contacts_limit, monthly_broadcasts_limit, monthly_messages_limit, team_members_limit, ai_monthly_credits_limit, automations_limit, api_access_enabled, agency_workspaces_enabled',
    )
    .eq('account_id', accountId)
    .maybeSingle()

  const limits: PlanLimits = { ...effectivePlan.limits }
  const override = (overrideRow ?? null) as EntitlementOverrideRow | null
  if (override) {
    for (const key of Object.keys(limits) as (keyof PlanLimits)[]) {
      const value = override[key]
      // Only non-null overrides win; NULL means "inherit the plan".
      if (value === null || value === undefined) continue
      if (typeof value === 'boolean' && typeof limits[key] === 'boolean') {
        ;(limits[key] as boolean) = value
      } else if (typeof value === 'number' && typeof limits[key] === 'number') {
        ;(limits[key] as number) = value
      }
    }
  }

  return {
    planId,
    effectivePlan,
    status,
    active,
    limits,
    currentPeriodEnd: sub?.current_period_end ?? null,
  }
}

/** Read a boolean feature flag for the account. */
export async function hasFeature(
  db: SupabaseClient,
  accountId: string,
  key: BooleanLimitKey,
): Promise<boolean> {
  const ent = await getAccountEntitlements(db, accountId)
  return Boolean(ent.limits[key])
}

export interface QuotaResult {
  allowed: boolean
  used: number
  limit: number
  planId: PlanId
  metric: string
}

/**
 * Atomically check-and-consume `amount` units of a metered quota.
 *
 * Delegates to the `consume_quota` SQL function (migration 040) so the
 * check and the increment happen under one row lock — a burst of
 * concurrent requests can't overshoot the limit the way a read-then-write
 * from the app would.
 *
 * Fails OPEN: if the RPC errors (missing migration, DB blip), the action
 * is allowed. Billing must never take the product down; over-usage is
 * recoverable, a false lockout of a paying customer is not.
 */
export async function consumeQuota(
  db: SupabaseClient,
  accountId: string,
  metric: NumericLimitKey,
  amount = 1,
): Promise<QuotaResult> {
  const ent = await getAccountEntitlements(db, accountId)
  const limit = ent.limits[metric] as number

  // Unlimited: skip the round trip entirely.
  if (limit === UNLIMITED || limit < 0) {
    return { allowed: true, used: 0, limit: UNLIMITED, planId: ent.planId, metric }
  }

  const { data, error } = await db.rpc('consume_quota', {
    p_account_id: accountId,
    p_metric: metric,
    p_amount: amount,
    p_limit: limit,
  })

  if (error) {
    console.error('[billing] consume_quota failed — failing open:', error.message)
    return { allowed: true, used: 0, limit, planId: ent.planId, metric }
  }

  // The RPC returns a single row: { allowed, used, quota_limit }.
  const row = (Array.isArray(data) ? data[0] : data) as
    | { allowed?: boolean; used?: number; quota_limit?: number }
    | null

  return {
    allowed: row?.allowed !== false,
    used: Number(row?.used ?? 0),
    limit: Number(row?.quota_limit ?? limit),
    planId: ent.planId,
    metric,
  }
}

/**
 * Standard 402 Payment Required response for an exceeded quota. Carries
 * enough for the UI to render a precise upgrade prompt without a second
 * round trip.
 */
export function upgradeRequiredResponse(result: QuotaResult): NextResponse {
  return NextResponse.json(
    {
      error: 'Plan limit reached',
      code: 'upgrade_required',
      metric: result.metric,
      limit: result.limit,
      used: result.used,
      plan: result.planId,
      upgrade_url: '/settings?tab=billing',
    },
    { status: 402 },
  )
}

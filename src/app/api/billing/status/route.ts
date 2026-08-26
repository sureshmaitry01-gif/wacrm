import { NextResponse } from 'next/server'

import { getCurrentAccount, toErrorResponse } from '@/lib/auth/account'
import { getAccountEntitlements } from '@/lib/billing/entitlements'
import { isDodoConfigured } from '@/lib/billing/config'
import { PLAN_CATALOG } from '@/lib/billing/plans'

/**
 * GET /api/billing/status
 *
 * Current plan, subscription status, effective limits, and this month's
 * usage. Any member (viewer+) may read it — the UI needs to show the plan
 * and render upgrade prompts. No provider secrets are exposed.
 */
export async function GET() {
  try {
    const { supabase, accountId } = await getCurrentAccount()
    const ent = await getAccountEntitlements(supabase, accountId)

    // This month's counters (RLS: members may read their account's rows).
    const periodStart = new Date()
    const monthStart = new Date(
      Date.UTC(periodStart.getUTCFullYear(), periodStart.getUTCMonth(), 1),
    )
      .toISOString()
      .slice(0, 10)

    const { data: counters } = await supabase
      .from('usage_counters')
      .select('metric, count')
      .eq('account_id', accountId)
      .eq('period_start', monthStart)

    const usage: Record<string, number> = {}
    for (const row of counters ?? []) {
      usage[(row as { metric: string }).metric] = Number(
        (row as { count: number }).count ?? 0,
      )
    }

    return NextResponse.json({
      plan: ent.planId,
      plan_name: ent.effectivePlan.name,
      status: ent.status,
      active: ent.active,
      limits: ent.limits,
      usage,
      current_period_end: ent.currentPeriodEnd,
      // Lets the UI hide upgrade CTAs on a deployment with no payment
      // provider configured (local dev, self-host).
      checkout_available: isDodoConfigured(),
      catalog: Object.values(PLAN_CATALOG).map((p) => ({
        id: p.id,
        name: p.name,
        price_inr_monthly: p.priceInrMonthly,
        description: p.description,
      })),
    })
  } catch (err) {
    return toErrorResponse(err)
  }
}

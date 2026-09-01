// ============================================================
// Public pricing view model — derives the landing page's pricing cards
// from the SAME canonical catalog the app/billing use
// (`src/lib/billing/plans.ts`), never a second hardcoded copy.
//
// Only the plans a visitor can actually see/buy are surfaced: Free,
// Starter, Growth, Agency. 'enterprise' is sales-led and intentionally
// left out of the self-serve pricing grid (it has no self-serve limits
// worth advertising — see PLAN_CATALOG.enterprise).
// ============================================================

import { PLAN_CATALOG, UNLIMITED, type PlanId } from '@/lib/billing/plans'

export interface PublicPricingPlan {
  id: PlanId
  name: string
  priceInrMonthly: number
  description: string
  /** Headline limits worth putting on a pricing card, in display order. */
  highlights: string[]
}

const PUBLIC_PLAN_ORDER: PlanId[] = ['free', 'starter', 'growth', 'agency']

function fmtCount(n: number): string {
  return n === UNLIMITED ? 'Unlimited' : n.toLocaleString('en-IN')
}

/** Build the public pricing grid straight from `PLAN_CATALOG` — no
 *  separately maintained numbers. */
export function getPublicPricingPlans(): PublicPricingPlan[] {
  return PUBLIC_PLAN_ORDER.map((id) => {
    const plan = PLAN_CATALOG[id]
    return {
      id: plan.id,
      name: plan.name,
      priceInrMonthly: plan.priceInrMonthly,
      description: plan.description,
      highlights: [
        `${fmtCount(plan.limits.contacts_limit)} contacts`,
        `${fmtCount(plan.limits.monthly_messages_limit)} messages / month`,
        `${fmtCount(plan.limits.monthly_broadcasts_limit)} campaigns / month`,
        `${fmtCount(plan.limits.ai_monthly_credits_limit)} AI credits / month`,
        `${fmtCount(plan.limits.team_members_limit)} team member${plan.limits.team_members_limit === 1 ? '' : 's'}`,
        ...(plan.limits.api_access_enabled ? ['API access'] : []),
        ...(plan.limits.agency_workspaces_enabled ? ['Agency workspaces'] : []),
      ],
    }
  })
}

/** ₹499 style formatting for a monthly platform fee. Free is called out
 *  explicitly rather than printed as "₹0". */
export function formatMonthlyPrice(priceInrMonthly: number): string {
  if (priceInrMonthly === 0) return 'Free'
  if (priceInrMonthly === UNLIMITED) return 'Custom'
  return `₹${priceInrMonthly.toLocaleString('en-IN')}`
}

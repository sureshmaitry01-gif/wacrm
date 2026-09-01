import { describe, it, expect } from 'vitest'

import { PLAN_CATALOG } from '@/lib/billing/plans'
import { getPublicPricingPlans, formatMonthlyPrice } from './pricing'

describe('getPublicPricingPlans', () => {
  it('surfaces exactly free/starter/growth/agency, in that order', () => {
    const plans = getPublicPricingPlans()
    expect(plans.map((p) => p.id)).toEqual(['free', 'starter', 'growth', 'agency'])
  })

  it('never surfaces enterprise (sales-led, no self-serve limits)', () => {
    const plans = getPublicPricingPlans()
    expect(plans.some((p) => p.id === 'enterprise')).toBe(false)
  })

  it('prices come straight from PLAN_CATALOG, not a second copy', () => {
    const plans = getPublicPricingPlans()
    for (const plan of plans) {
      expect(plan.priceInrMonthly).toBe(PLAN_CATALOG[plan.id].priceInrMonthly)
      expect(plan.description).toBe(PLAN_CATALOG[plan.id].description)
    }
  })

  it('growth highlights include API access, agency does not (until agency-specific)', () => {
    const plans = getPublicPricingPlans()
    const growth = plans.find((p) => p.id === 'growth')!
    const agency = plans.find((p) => p.id === 'agency')!
    expect(growth.highlights).toContain('API access')
    expect(agency.highlights).toContain('Agency workspaces')
  })

  it('formats unlimited limits as "Unlimited", not -1', () => {
    const plans = getPublicPricingPlans()
    const agency = plans.find((p) => p.id === 'agency')!
    expect(agency.highlights.some((h) => h.includes('-1'))).toBe(false)
    expect(agency.highlights).toContain('Unlimited campaigns / month')
  })
})

describe('formatMonthlyPrice', () => {
  it('renders 0 as "Free"', () => {
    expect(formatMonthlyPrice(0)).toBe('Free')
  })

  it('renders a normal price with a rupee sign and Indian digit grouping', () => {
    expect(formatMonthlyPrice(1499)).toBe('₹1,499')
  })

  it('renders the UNLIMITED sentinel as "Custom"', () => {
    expect(formatMonthlyPrice(-1)).toBe('Custom')
  })
})

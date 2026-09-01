import { describe, it, expect } from 'vitest'

import { PLAN_CATALOG } from '@/lib/billing/plans'
import {
  getPricingMatrix,
  getPublicPricingPlans,
  formatMonthlyPrice,
} from './pricing'

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

describe('getPricingMatrix', () => {
  it('gives every row exactly one value per public plan, in plan order', () => {
    const matrix = getPricingMatrix()
    const planCount = getPublicPricingPlans().length
    expect(matrix.length).toBeGreaterThan(0)
    for (const row of matrix) {
      expect(row.values).toHaveLength(planCount)
    }
  })

  it('reads numeric limits straight from PLAN_CATALOG', () => {
    const matrix = getPricingMatrix()
    const contacts = matrix.find((r) => r.label === 'Contacts')!
    // Free is the first public plan; its value must be the catalog's,
    // formatted for display rather than restated.
    expect(contacts.values[0]).toBe(
      PLAN_CATALOG.free.limits.contacts_limit.toLocaleString('en-IN'),
    )
    const team = matrix.find((r) => r.label === 'Team members')!
    expect(team.values[2]).toBe(
      PLAN_CATALOG.growth.limits.team_members_limit.toLocaleString('en-IN'),
    )
  })

  it('renders boolean features as Included / em dash, never true/false', () => {
    const matrix = getPricingMatrix()
    const api = matrix.find((r) => r.label === 'API access')!
    // free, starter -> off; growth, agency -> on
    expect(api.values).toEqual(['—', '—', 'Included', 'Included'])
    const agency = matrix.find((r) => r.label === 'Agency workspaces')!
    expect(agency.values).toEqual(['—', '—', '—', 'Included'])
  })

  it('never leaks the UNLIMITED sentinel into a displayed value', () => {
    const matrix = getPricingMatrix()
    const all = matrix.flatMap((r) => r.values)
    expect(all.some((v) => v.includes('-1'))).toBe(false)
    // Agency's campaign allowance is unlimited in the catalog.
    const campaigns = matrix.find((r) => r.label === 'Campaigns / month')!
    expect(campaigns.values[3]).toBe('Unlimited')
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

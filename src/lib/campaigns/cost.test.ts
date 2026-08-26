import { describe, expect, it } from 'vitest'
import { estimateCampaignCost } from './cost'
import { CampaignError } from './errors'
import type { RateCard } from './meta-rate-card'

describe('estimateCampaignCost', () => {
  it('computes India marketing cost with no markup (transparent)', () => {
    const e = estimateCampaignCost({ category: 'marketing', recipients: 1000 })
    expect(e.country).toBe('IN')
    expect(e.currency).toBe('INR')
    expect(e.rate_per_message).toBe(0.8631)
    expect(e.billable_messages).toBe(1000)
    expect(e.meta_cost).toBe(863.1)
    expect(e.platform_markup).toBe(0)
    expect(e.tax).toBe(0)
    expect(e.estimated_total).toBe(863.1)
    expect(e.cost_per_recipient).toBeCloseTo(0.8631, 2)
  })

  it('prices utility and authentication at the lower rate', () => {
    expect(estimateCampaignCost({ category: 'utility', recipients: 100 }).meta_cost).toBe(11.5)
    expect(
      estimateCampaignCost({ category: 'authentication', recipients: 100 }).meta_cost,
    ).toBe(11.5)
  })

  it('scales by delivery rate (bills per delivered message)', () => {
    const e = estimateCampaignCost({
      category: 'marketing',
      recipients: 1000,
      deliveryRate: 0.9,
    })
    expect(e.billable_messages).toBe(900)
    expect(e.meta_cost).toBe(776.79)
  })

  it('applies a platform markup when asked', () => {
    const e = estimateCampaignCost({
      category: 'utility',
      recipients: 1000,
      platformMarkupPct: 10,
    })
    expect(e.meta_cost).toBe(115)
    expect(e.platform_markup).toBe(11.5)
    expect(e.estimated_total).toBe(126.5)
  })

  it('applies tax on top of meta + markup', () => {
    const e = estimateCampaignCost({
      category: 'utility',
      recipients: 1000,
      platformMarkupPct: 0,
      taxPct: 18,
    })
    expect(e.meta_cost).toBe(115)
    expect(e.tax).toBe(20.7)
    expect(e.estimated_total).toBe(135.7)
  })

  it('returns all zeros for zero recipients (valid)', () => {
    const e = estimateCampaignCost({ category: 'marketing', recipients: 0 })
    expect(e.meta_cost).toBe(0)
    expect(e.estimated_total).toBe(0)
    expect(e.cost_per_recipient).toBe(0)
  })

  it('always carries an unverified-rates warning for the default card', () => {
    const e = estimateCampaignCost({ category: 'marketing', recipients: 1 })
    expect(e.verified).toBe(false)
    expect(e.warning).toMatch(/unverified/i)
  })

  it('works with an injected (editable) rate card — rates are not hardcoded truth', () => {
    const card: RateCard = {
      country: 'IN',
      currency: 'INR',
      effective_from: '2027-01-01',
      source: 'test',
      verified: true,
      rates: { marketing: 1.5, utility: 0.2, authentication: 0.2, service: 0 },
    }
    const e = estimateCampaignCost({
      category: 'marketing',
      recipients: 10,
      rateCard: card,
    })
    expect(e.meta_cost).toBe(15)
    expect(e.verified).toBe(true)
    expect(e.warning).not.toMatch(/unverified/i)
  })

  it('throws on an unknown country', () => {
    expect(() =>
      estimateCampaignCost({ category: 'marketing', recipients: 1, country: 'ZZ' }),
    ).toThrow(CampaignError)
  })

  it('throws on an unknown category', () => {
    expect(() =>
      // @ts-expect-error — exercising the runtime guard
      estimateCampaignCost({ category: 'promotional', recipients: 1 }),
    ).toThrow(/unknown message category/i)
  })

  it('throws on negative / non-integer recipients', () => {
    expect(() => estimateCampaignCost({ category: 'marketing', recipients: -5 })).toThrow(
      CampaignError,
    )
    expect(() =>
      estimateCampaignCost({ category: 'marketing', recipients: 3.5 }),
    ).toThrow(/non-negative integer/i)
  })

  it('rejects an out-of-range delivery rate', () => {
    expect(() =>
      estimateCampaignCost({ category: 'marketing', recipients: 1, deliveryRate: 1.5 }),
    ).toThrow(/deliveryRate/i)
  })
})

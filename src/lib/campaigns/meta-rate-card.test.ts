import { describe, expect, it } from 'vitest'
import {
  categoryFromTemplate,
  getRateCard,
  META_RATE_CARDS,
} from './meta-rate-card'

describe('meta rate card', () => {
  it('has an India card with the documented (unverified) defaults', () => {
    const card = getRateCard('IN')
    expect(card).not.toBeNull()
    expect(card!.currency).toBe('INR')
    expect(card!.effective_from).toBe('2026-07-01')
    expect(card!.verified).toBe(false)
    expect(card!.rates.marketing).toBe(0.8631)
    expect(card!.rates.utility).toBe(0.115)
    expect(card!.rates.authentication).toBe(0.115)
    expect(card!.rates.service).toBe(0)
  })

  it('is case-insensitive on country', () => {
    expect(getRateCard('in')?.country).toBe('IN')
  })

  it('returns null for an unknown country (no guessing)', () => {
    expect(getRateCard('US')).toBeNull()
  })

  it('every card carries a source note and effective date', () => {
    for (const card of META_RATE_CARDS) {
      expect(card.source.length).toBeGreaterThan(0)
      expect(card.effective_from).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    }
  })

  it('maps app template categories onto Meta categories', () => {
    expect(categoryFromTemplate('Marketing')).toBe('marketing')
    expect(categoryFromTemplate('UTILITY')).toBe('utility')
    expect(categoryFromTemplate('Authentication')).toBe('authentication')
    expect(categoryFromTemplate('nonsense')).toBeNull()
  })
})

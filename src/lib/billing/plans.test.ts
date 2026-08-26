import { describe, expect, it } from 'vitest'
import {
  DEFAULT_PLAN_ID,
  getPlan,
  isPlanId,
  PLAN_CATALOG,
  PLAN_IDS,
  UNLIMITED,
} from './plans'

describe('plan catalog', () => {
  it('exposes every plan id', () => {
    expect(PLAN_IDS).toEqual([
      'free',
      'starter',
      'growth',
      'agency',
      'enterprise',
    ])
  })

  it('every plan defines all limit keys', () => {
    const keys = [
      'contacts_limit',
      'monthly_broadcasts_limit',
      'monthly_messages_limit',
      'team_members_limit',
      'ai_monthly_credits_limit',
      'automations_limit',
      'api_access_enabled',
      'agency_workspaces_enabled',
    ]
    for (const plan of Object.values(PLAN_CATALOG)) {
      for (const key of keys) {
        expect(plan.limits, `${plan.id}.${key}`).toHaveProperty(key)
      }
    }
  })

  it('limits increase monotonically across the paid ladder', () => {
    const ladder = ['free', 'starter', 'growth', 'agency'] as const
    for (let i = 1; i < ladder.length; i++) {
      const prev = PLAN_CATALOG[ladder[i - 1]].limits.monthly_messages_limit
      const cur = PLAN_CATALOG[ladder[i]].limits.monthly_messages_limit
      expect(cur, `${ladder[i]} vs ${ladder[i - 1]}`).toBeGreaterThan(prev)
    }
  })

  it('free plan does not unlock API or agency workspaces', () => {
    expect(PLAN_CATALOG.free.limits.api_access_enabled).toBe(false)
    expect(PLAN_CATALOG.free.limits.agency_workspaces_enabled).toBe(false)
  })

  it('enterprise is unlimited across numeric limits', () => {
    const l = PLAN_CATALOG.enterprise.limits
    expect(l.contacts_limit).toBe(UNLIMITED)
    expect(l.monthly_messages_limit).toBe(UNLIMITED)
    expect(l.team_members_limit).toBe(UNLIMITED)
  })

  it('isPlanId narrows known ids only', () => {
    expect(isPlanId('growth')).toBe(true)
    expect(isPlanId('platinum')).toBe(false)
    expect(isPlanId(null)).toBe(false)
  })

  it('getPlan falls back to the default plan for unknown ids', () => {
    expect(getPlan('nope').id).toBe(DEFAULT_PLAN_ID)
    expect(getPlan(null).id).toBe(DEFAULT_PLAN_ID)
    expect(getPlan('agency').id).toBe('agency')
  })
})

import { describe, expect, it } from 'vitest'
import { paymentNotice } from './payment-status'

describe('paymentNotice', () => {
  it('warns (temporary) on a failed payment', () => {
    const n = paymentNotice('failed')
    expect(n?.tone).toBe('warning')
    expect(n?.title).toMatch(/attention/i)
  })

  it('warns (temporary) when on hold', () => {
    expect(paymentNotice('on_hold')?.tone).toBe('warning')
  })

  it('is critical when expired, and mentions the free-plan fallback', () => {
    const n = paymentNotice('expired')
    expect(n?.tone).toBe('critical')
    expect(n?.body).toMatch(/free.plan/i)
  })

  it('shows nothing for healthy or non-actionable states', () => {
    for (const s of ['active', 'trialing', 'canceled', 'incomplete', 'unknown']) {
      expect(paymentNotice(s)).toBeNull()
    }
  })

  it('never invents an alarming tone for a healthy plan', () => {
    expect(paymentNotice('active')).toBeNull()
    expect(paymentNotice('trialing')).toBeNull()
  })
})

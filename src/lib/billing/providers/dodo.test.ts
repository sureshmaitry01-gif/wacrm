import crypto from 'node:crypto'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { DodoProvider, statusForDodoEvent } from './dodo'

const SECRET = 'whsec_' + Buffer.from('super-secret-key').toString('base64')

function sign(id: string, timestamp: string, body: string, secret = SECRET) {
  const key = secret.startsWith('whsec_')
    ? Buffer.from(secret.slice(6), 'base64')
    : Buffer.from(secret)
  return crypto.createHmac('sha256', key).update(`${id}.${timestamp}.${body}`).digest('base64')
}

function headers(overrides: Record<string, string> = {}): Headers {
  return new Headers({
    'webhook-id': 'evt_1',
    'webhook-timestamp': '1730000000',
    ...overrides,
  })
}

describe('DodoProvider.verifyWebhookSignature', () => {
  const provider = new DodoProvider()

  beforeEach(() => {
    process.env.DODO_WEBHOOK_SECRET = SECRET
  })
  afterEach(() => {
    delete process.env.DODO_WEBHOOK_SECRET
  })

  it('FAILS CLOSED when the secret is not configured', () => {
    delete process.env.DODO_WEBHOOK_SECRET
    const body = '{}'
    const res = provider.verifyWebhookSignature(
      body,
      headers({ 'webhook-signature': sign('evt_1', '1730000000', body) }),
    )
    expect(res.valid).toBe(false)
    expect(res.reason).toMatch(/not set/i)
  })

  it('accepts a correctly signed payload', () => {
    const body = JSON.stringify({ type: 'subscription.active' })
    const sig = sign('evt_1', '1730000000', body)
    expect(
      provider.verifyWebhookSignature(body, headers({ 'webhook-signature': sig }))
        .valid,
    ).toBe(true)
  })

  it('accepts the versioned "v1,<sig>" header form', () => {
    const body = JSON.stringify({ type: 'subscription.active' })
    const sig = sign('evt_1', '1730000000', body)
    expect(
      provider.verifyWebhookSignature(
        body,
        headers({ 'webhook-signature': `v1,${sig}` }),
      ).valid,
    ).toBe(true)
  })

  it('accepts svix-* header aliases', () => {
    const body = '{"type":"subscription.active"}'
    const sig = sign('evt_9', '1730000001', body)
    const h = new Headers({
      'svix-id': 'evt_9',
      'svix-timestamp': '1730000001',
      'svix-signature': sig,
    })
    expect(provider.verifyWebhookSignature(body, h).valid).toBe(true)
  })

  it('rejects a tampered body', () => {
    const body = JSON.stringify({ type: 'subscription.active' })
    const sig = sign('evt_1', '1730000000', body)
    const tampered = JSON.stringify({ type: 'subscription.cancelled' })
    expect(
      provider.verifyWebhookSignature(
        tampered,
        headers({ 'webhook-signature': sig }),
      ).valid,
    ).toBe(false)
  })

  it('rejects a signature made with the wrong secret', () => {
    const body = '{}'
    const sig = sign('evt_1', '1730000000', body, 'whsec_' + Buffer.from('other').toString('base64'))
    expect(
      provider.verifyWebhookSignature(body, headers({ 'webhook-signature': sig }))
        .valid,
    ).toBe(false)
  })

  it('rejects when signature headers are missing', () => {
    expect(provider.verifyWebhookSignature('{}', new Headers()).valid).toBe(false)
  })
})

describe('statusForDodoEvent', () => {
  it('maps lifecycle events onto local statuses', () => {
    expect(statusForDodoEvent('subscription.active')).toBe('active')
    expect(statusForDodoEvent('subscription.renewed')).toBe('active')
    expect(statusForDodoEvent('subscription.on_hold')).toBe('on_hold')
    expect(statusForDodoEvent('subscription.cancelled')).toBe('canceled')
    expect(statusForDodoEvent('subscription.expired')).toBe('expired')
    expect(statusForDodoEvent('subscription.failed')).toBe('failed')
  })

  it('returns null (known, no status change) for data-only events', () => {
    expect(statusForDodoEvent('subscription.updated')).toBeNull()
    expect(statusForDodoEvent('subscription.plan_changed')).toBeNull()
    expect(statusForDodoEvent('payment.succeeded')).toBeNull()
    expect(statusForDodoEvent('payment.failed')).toBeNull()
  })

  it('returns undefined for unrecognized events', () => {
    expect(statusForDodoEvent('totally.unknown')).toBeUndefined()
  })
})

describe('DodoProvider.mapWebhookEvent', () => {
  const provider = new DodoProvider()

  it('extracts account_id from metadata and the implied status', () => {
    const event = provider.mapWebhookEvent(
      JSON.stringify({
        id: 'evt_123',
        type: 'subscription.active',
        data: {
          subscription_id: 'sub_1',
          customer_id: 'cus_1',
          metadata: { account_id: 'acc-9', plan_id: 'growth' },
          next_billing_date: '2026-09-01T00:00:00Z',
        },
      }),
    )
    expect(event).toMatchObject({
      id: 'evt_123',
      type: 'subscription.active',
      status: 'active',
      accountId: 'acc-9',
      planId: 'growth',
      providerSubscriptionId: 'sub_1',
      providerCustomerId: 'cus_1',
      currentPeriodEnd: '2026-09-01T00:00:00Z',
      unknown: false,
    })
  })

  it('flags unrecognized event types as unknown without throwing', () => {
    const event = provider.mapWebhookEvent(
      JSON.stringify({ id: 'evt_x', type: 'weird.event', data: {} }),
    )
    expect(event.unknown).toBe(true)
    expect(event.status).toBeNull()
  })

  it('never throws on malformed JSON', () => {
    const event = provider.mapWebhookEvent('not json at all')
    expect(event.unknown).toBe(true)
    expect(event.type).toBe('unknown')
  })

  it('derives the plan from the product id when metadata lacks one', () => {
    process.env.DODO_GROWTH_PRODUCT_ID = 'prod_growth_1'
    try {
      const event = provider.mapWebhookEvent(
        JSON.stringify({
          id: 'evt_2',
          type: 'subscription.renewed',
          data: { subscription_id: 'sub_2', product_id: 'prod_growth_1' },
        }),
      )
      expect(event.planId).toBe('growth')
      expect(event.status).toBe('active')
    } finally {
      delete process.env.DODO_GROWTH_PRODUCT_ID
    }
  })

  it('ignores an unknown plan id in metadata rather than trusting it', () => {
    const event = provider.mapWebhookEvent(
      JSON.stringify({
        id: 'evt_3',
        type: 'subscription.active',
        data: { metadata: { plan_id: 'platinum' } },
      }),
    )
    expect(event.planId).toBeNull()
  })
})

describe('DodoProvider.isConfigured', () => {
  afterEach(() => delete process.env.DODO_API_KEY)

  it('is false without an API key (local dev stays functional)', () => {
    expect(new DodoProvider().isConfigured()).toBe(false)
  })

  it('is true once the API key is set', () => {
    process.env.DODO_API_KEY = 'dodo_test_key'
    expect(new DodoProvider().isConfigured()).toBe(true)
  })
})

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

// Mock the real SDKs so tests assert forwarding without any network I/O.
const h = vi.hoisted(() => ({
  sentryCaptureException: vi.fn(),
  sentryCaptureMessage: vi.fn(),
  posthogCapture: vi.fn(),
}))

vi.mock('@sentry/nextjs', () => ({
  captureException: h.sentryCaptureException,
  captureMessage: h.sentryCaptureMessage,
  captureRequestError: vi.fn(),
  init: vi.fn(),
}))

vi.mock('posthog-node', () => ({
  // A class so `new PostHog(...)` is constructable; instances expose the
  // shared capture spy.
  PostHog: class {
    capture = h.posthogCapture
  },
}))

import {
  captureEvent,
  captureException,
  captureMessage,
  isAnalyticsEnabled,
  isSentryEnabled,
  sanitizeProps,
} from './index'
import { __resetAnalyticsForTests } from './analytics'

describe('sentry seam', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    delete process.env.SENTRY_DSN
  })
  afterEach(() => delete process.env.SENTRY_DSN)

  it('is disabled and forwards nothing when SENTRY_DSN is unset', () => {
    expect(isSentryEnabled()).toBe(false)
    captureException(new Error('boom'))
    captureMessage('hi')
    expect(h.sentryCaptureException).not.toHaveBeenCalled()
    expect(h.sentryCaptureMessage).not.toHaveBeenCalled()
  })

  it('forwards to Sentry.captureException when SENTRY_DSN is set', () => {
    process.env.SENTRY_DSN = 'https://example@sentry.io/1'
    const err = new Error('boom')
    captureException(err, { route: '/x' })
    expect(h.sentryCaptureException).toHaveBeenCalledOnce()
    expect(h.sentryCaptureException).toHaveBeenCalledWith(err, {
      extra: { route: '/x' },
    })
  })

  it('strips PII from the error context before it reaches Sentry', () => {
    process.env.SENTRY_DSN = 'https://example@sentry.io/1'
    captureException(new Error('x'), {
      route: '/y',
      customer_phone: '+9199',
      access_token: 'sk',
    })
    const [, opts] = h.sentryCaptureException.mock.calls[0]
    expect(opts.extra).toEqual({ route: '/y' })
  })

  it('forwards captureMessage with an info level when enabled', () => {
    process.env.SENTRY_DSN = 'https://example@sentry.io/1'
    captureMessage('hello')
    expect(h.sentryCaptureMessage).toHaveBeenCalledWith('hello', {
      level: 'info',
    })
  })
})

describe('analytics seam', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    __resetAnalyticsForTests()
    delete process.env.NEXT_PUBLIC_POSTHOG_KEY
  })
  afterEach(() => {
    __resetAnalyticsForTests()
    delete process.env.NEXT_PUBLIC_POSTHOG_KEY
  })

  it('is disabled and forwards nothing when the PostHog key is unset', () => {
    expect(isAnalyticsEnabled()).toBe(false)
    captureEvent('campaign_created', { recipient_count: 10 })
    expect(h.posthogCapture).not.toHaveBeenCalled()
  })

  it('forwards to posthog capture when the key is set', () => {
    process.env.NEXT_PUBLIC_POSTHOG_KEY = 'phc_test'
    expect(isAnalyticsEnabled()).toBe(true)
    captureEvent('campaign_created', { recipient_count: 10 })
    expect(h.posthogCapture).toHaveBeenCalledOnce()
    expect(h.posthogCapture).toHaveBeenCalledWith({
      distinctId: 'backend',
      event: 'campaign_created',
      properties: { recipient_count: 10 },
    })
  })

  it('uses distinct_id as the PostHog id and does not send it as a property', () => {
    process.env.NEXT_PUBLIC_POSTHOG_KEY = 'phc_test'
    captureEvent('plan_upgraded', { distinct_id: 'acct-1', plan: 'growth' })
    expect(h.posthogCapture).toHaveBeenCalledWith({
      distinctId: 'acct-1',
      event: 'plan_upgraded',
      properties: { plan: 'growth' },
    })
  })

  it('keeps sanitizeProps in the capture path (PII never reaches PostHog)', () => {
    process.env.NEXT_PUBLIC_POSTHOG_KEY = 'phc_test'
    captureEvent('campaign_created', {
      recipient_count: 250,
      customer_phone: '+919999999999',
      message_body: 'hello',
      email: 'a@b.com',
    })
    const arg = h.posthogCapture.mock.calls[0][0]
    expect(arg.properties).toEqual({ recipient_count: 250 })
  })

  it('sanitizeProps strips sensitive property keys (unit)', () => {
    expect(
      sanitizeProps({
        recipient_count: 250,
        customer_phone: '+919999999999',
        message_body: 'hello',
        access_token: 'secret',
        email: 'a@b.com',
        contact_name: 'Asha',
        plan: 'starter',
      }),
    ).toEqual({ recipient_count: 250, plan: 'starter' })
  })
})

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  captureEvent,
  captureException,
  captureMessage,
  isAnalyticsEnabled,
  isSentryEnabled,
  sanitizeProps,
} from './index'

describe('sentry seam', () => {
  beforeEach(() => delete process.env.SENTRY_DSN)
  afterEach(() => {
    delete process.env.SENTRY_DSN
    vi.restoreAllMocks()
  })

  it('is disabled and no-ops when SENTRY_DSN is unset', () => {
    const err = vi.spyOn(console, 'error').mockImplementation(() => {})
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    expect(isSentryEnabled()).toBe(false)
    captureException(new Error('boom'))
    captureMessage('hi')
    expect(err).not.toHaveBeenCalled()
    expect(warn).not.toHaveBeenCalled()
  })

  it('emits to console when SENTRY_DSN is set', () => {
    process.env.SENTRY_DSN = 'https://example@sentry.io/1'
    const err = vi.spyOn(console, 'error').mockImplementation(() => {})
    expect(isSentryEnabled()).toBe(true)
    captureException(new Error('boom'), { route: '/x' })
    expect(err).toHaveBeenCalledOnce()
  })
})

describe('analytics seam', () => {
  beforeEach(() => delete process.env.NEXT_PUBLIC_POSTHOG_KEY)
  afterEach(() => {
    delete process.env.NEXT_PUBLIC_POSTHOG_KEY
    vi.restoreAllMocks()
  })

  it('is disabled and no-ops when the PostHog key is unset', () => {
    const info = vi.spyOn(console, 'info').mockImplementation(() => {})
    expect(isAnalyticsEnabled()).toBe(false)
    captureEvent('campaign_created', { recipient_count: 10 })
    expect(info).not.toHaveBeenCalled()
  })

  it('emits when the PostHog key is set', () => {
    process.env.NEXT_PUBLIC_POSTHOG_KEY = 'phc_test'
    const info = vi.spyOn(console, 'info').mockImplementation(() => {})
    expect(isAnalyticsEnabled()).toBe(true)
    captureEvent('campaign_created', { recipient_count: 10 })
    expect(info).toHaveBeenCalledOnce()
  })

  it('strips sensitive property keys (PII guard)', () => {
    const clean = sanitizeProps({
      recipient_count: 250,
      customer_phone: '+919999999999',
      message_body: 'hello',
      access_token: 'secret',
      email: 'a@b.com',
      contact_name: 'Asha',
      plan: 'starter',
    })
    expect(clean).toEqual({ recipient_count: 250, plan: 'starter' })
  })
})

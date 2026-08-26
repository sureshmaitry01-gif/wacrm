import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { authorizeCronRequest } from './auth'

function req(headers: Record<string, string>): Request {
  return new Request('https://example.com/api/automations/cron', { headers })
}

describe('authorizeCronRequest', () => {
  beforeEach(() => {
    delete process.env.AUTOMATION_CRON_SECRET
    delete process.env.CRON_SECRET
  })
  afterEach(() => {
    delete process.env.AUTOMATION_CRON_SECRET
    delete process.env.CRON_SECRET
  })

  it('returns 503 when no secret is provisioned', () => {
    const res = authorizeCronRequest(req({ 'x-cron-secret': 'anything' }))
    expect(res).toEqual({ ok: false, status: 503, error: 'cron not configured' })
  })

  it('authorizes the existing x-cron-secret header path', () => {
    process.env.AUTOMATION_CRON_SECRET = 'header-secret'
    expect(authorizeCronRequest(req({ 'x-cron-secret': 'header-secret' })).ok).toBe(
      true,
    )
  })

  it('rejects a wrong x-cron-secret with 401', () => {
    process.env.AUTOMATION_CRON_SECRET = 'header-secret'
    const res = authorizeCronRequest(req({ 'x-cron-secret': 'nope' }))
    expect(res).toMatchObject({ ok: false, status: 401 })
  })

  it('authorizes the Vercel Cron Authorization: Bearer path', () => {
    process.env.CRON_SECRET = 'vercel-secret'
    expect(
      authorizeCronRequest(req({ authorization: 'Bearer vercel-secret' })).ok,
    ).toBe(true)
  })

  it('rejects a wrong bearer token with 401', () => {
    process.env.CRON_SECRET = 'vercel-secret'
    const res = authorizeCronRequest(req({ authorization: 'Bearer wrong' }))
    expect(res).toMatchObject({ ok: false, status: 401 })
  })

  it('accepts either credential when both secrets are provisioned', () => {
    process.env.AUTOMATION_CRON_SECRET = 'header-secret'
    process.env.CRON_SECRET = 'vercel-secret'
    expect(authorizeCronRequest(req({ 'x-cron-secret': 'header-secret' })).ok).toBe(
      true,
    )
    expect(
      authorizeCronRequest(req({ authorization: 'Bearer vercel-secret' })).ok,
    ).toBe(true)
    expect(authorizeCronRequest(req({})).ok).toBe(false)
  })

  it('does not authorize a bearer token against the header secret', () => {
    // The two secrets are independent; a bearer must match CRON_SECRET.
    process.env.AUTOMATION_CRON_SECRET = 'header-secret'
    const res = authorizeCronRequest(req({ authorization: 'Bearer header-secret' }))
    expect(res).toMatchObject({ ok: false, status: 401 })
  })
})

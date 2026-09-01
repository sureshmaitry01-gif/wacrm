import { afterEach, describe, expect, it, vi } from 'vitest'
import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'

// ---------------------------------------------------------------------------
// `/` must serve the public marketing page to a signed-out visitor and
// preserve the old dashboard-redirect for a signed-in one. Regression
// target: `/` used to unconditionally `redirect('/dashboard')` regardless
// of auth state, so an unauthenticated visitor never saw a marketing page
// at all — they bounced through /dashboard → /login.
// ---------------------------------------------------------------------------

const getUser = vi.fn()
vi.mock('@/lib/supabase/server', () => ({
  createClient: () => Promise.resolve({ auth: { getUser } }),
}))

const redirect = vi.fn((path: string) => {
  throw new Error(`REDIRECT:${path}`)
})
vi.mock('next/navigation', () => ({ redirect }))

const { default: RootPage } = await import('./page')

afterEach(() => {
  vi.clearAllMocks()
})

describe('RootPage (/)', () => {
  it('renders the public landing page for a signed-out visitor without redirecting', async () => {
    getUser.mockResolvedValue({ data: { user: null }, error: null })

    const element = await RootPage()
    expect(redirect).not.toHaveBeenCalled()

    const html = renderToStaticMarkup(element)
    // The primary CTAs must point at the real signup/login routes.
    expect(html).toContain('href="/signup"')
    expect(html).toContain('href="/login"')
    // Pricing is present and sourced from the real plan catalog.
    expect(html).toContain('Starter')
    expect(html).toContain('Growth')
    expect(html).toContain('Agency')
  })

  it('ships the claims that keep the marketing honest', async () => {
    getUser.mockResolvedValue({ data: { user: null }, error: null })
    const html = renderToStaticMarkup(await RootPage())

    // We are not a Meta partner and must never imply it.
    expect(html).toContain(
      'Not affiliated with, endorsed by, or a partner of WhatsApp or Meta.',
    )
    // Cost figures are estimates against a rate card Meta controls, and
    // the page has to say so next to the numbers it shows.
    expect(html).toMatch(/Illustrative/)
    expect(html).toMatch(/Meta sets these rates and can change them/)
    // The legal/support routes exist and are linked, not dead ends.
    for (const href of ['/privacy', '/terms', '/support']) {
      expect(html).toContain(`href="${href}"`)
    }
  })

  it('does not invent social proof', async () => {
    getUser.mockResolvedValue({ data: { user: null }, error: null })
    const html = renderToStaticMarkup(await RootPage())

    // Guard against the usual fabrications creeping back in: this
    // product has no named customers, no testimonials, and no
    // certifications yet.
    expect(html).not.toMatch(/trusted by/i)
    expect(html).not.toMatch(/customers worldwide/i)
    expect(html).not.toMatch(/\bSOC ?2\b/i)
    expect(html).not.toMatch(/ISO ?27001/i)
  })

  it('redirects a signed-in user to /dashboard (unchanged prior behavior)', async () => {
    getUser.mockResolvedValue({
      data: { user: { id: 'user-1' } },
      error: null,
    })

    await expect(RootPage()).rejects.toThrow('REDIRECT:/dashboard')
    expect(redirect).toHaveBeenCalledWith('/dashboard')
  })
})

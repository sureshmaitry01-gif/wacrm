import { describe, expect, it } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'

import { Symbol, Wordmark, type SymbolName } from './symbols'

// ---------------------------------------------------------------------
// The marketing symbol set. These marks sit beside real text labels, so
// the contract that matters is: every named symbol actually renders
// artwork, and none of them is announced to a screen reader.
// ---------------------------------------------------------------------

const NAMES: SymbolName[] = [
  'inbox',
  'campaign',
  'contacts',
  'template',
  'ai',
  'economics',
  'analytics',
  'language',
  'security',
  'connect',
]

describe('Symbol', () => {
  it.each(NAMES)('renders artwork for "%s"', (name) => {
    const html = renderToStaticMarkup(<Symbol name={name} />)
    expect(html).toContain('<svg')
    // Something must actually be drawn — a bare <svg> would mean the
    // name fell through the lookup.
    expect(/<(path|rect|circle|text)/.test(html)).toBe(true)
  })

  it.each(NAMES)('hides "%s" from assistive tech', (name) => {
    const html = renderToStaticMarkup(<Symbol name={name} />)
    expect(html).toContain('aria-hidden="true"')
    expect(html).toContain('focusable="false"')
  })

  it('retunes its fills on the dark section rather than keeping mint', () => {
    const light = renderToStaticMarkup(<Symbol name="security" />)
    const dark = renderToStaticMarkup(<Symbol name="security" tone="dark" />)

    // Fills are always written as `var(--sym-fill, var(--mint-strong))`.
    // On paper nothing overrides them, so the mint fallback is what
    // paints; on the ink section the root svg sets the override.
    expect(light).toContain('var(--mint-strong)')
    expect(light).not.toContain('--ink-line')
    expect(dark).toContain('--ink-line')
  })

  it('carries the hover-animation hooks the motion system drives', () => {
    // These class names are the contract with globals.css; if they are
    // renamed in one place and not the other the symbols silently stop
    // animating (and stop being reduced-motion safe).
    const all = NAMES.map((n) => renderToStaticMarkup(<Symbol name={n} />)).join('')
    expect(all).toContain('m-sym-draw')
    expect(all).toContain('m-sym-enter')
  })
})

describe('Wordmark', () => {
  it('renders the product name as text, with the mark hidden', () => {
    const html = renderToStaticMarkup(<Wordmark label="wacrm" />)
    expect(html).toContain('wacrm')
    expect(html).toContain('aria-hidden="true"')
  })
})

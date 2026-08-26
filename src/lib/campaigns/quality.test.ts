import { describe, expect, it } from 'vitest'
import { scoreCampaign } from './quality'

describe('scoreCampaign', () => {
  it('rates a clean, personalized marketing message highly', () => {
    const r = scoreCampaign({
      body: 'Hi {{1}}, our new season collection just arrived. Reply YES to see this week’s picks or visit our store.',
      category: 'Marketing',
      buttons: [{ type: 'QUICK_REPLY', text: 'Show me' }],
    })
    expect(r.score).toBeGreaterThanOrEqual(85)
    expect(['A', 'B']).toContain(r.grade)
    expect(r.risk_level).toBe('low')
  })

  it('flags a spammy, shouty message as high risk with a low score', () => {
    const r = scoreCampaign({
      body: 'CONGRATULATIONS!!! YOU WON A FREE CASH PRIZE — ACT NOW, LIMITED TIME, 100% GUARANTEED. CLICK HERE!!!',
      category: 'Marketing',
    })
    expect(r.score).toBeLessThan(50)
    expect(r.risk_level).toBe('high')
    expect(r.issues.some((i) => i.code === 'spam_words')).toBe(true)
    expect(r.issues.some((i) => i.code === 'shouting')).toBe(true)
    expect(r.metrics.spam_word_hits.length).toBeGreaterThanOrEqual(3)
  })

  it('penalizes a body over Meta’s 1024-char limit', () => {
    const r = scoreCampaign({ body: 'a'.repeat(1100) })
    expect(r.issues.some((i) => i.code === 'over_limit')).toBe(true)
    expect(r.grade).not.toBe('A')
  })

  it('flags adjacent variables (Meta rejects them)', () => {
    const r = scoreCampaign({
      body: 'Hello {{1}}{{2}}, welcome to our store and thanks for joining us today.',
    })
    expect(r.issues.some((i) => i.code === 'adjacent_variables')).toBe(true)
    expect(r.risk_level).toBe('high')
  })

  it('flags a variable-only body', () => {
    const r = scoreCampaign({ body: '{{1}} {{2}}' })
    expect(r.issues.some((i) => i.code === 'variable_only')).toBe(true)
  })

  it('flags a message with no clear CTA', () => {
    const r = scoreCampaign({
      body: 'Our bakery has been part of this lane for over a decade, and we are truly grateful.',
    })
    expect(r.issues.some((i) => i.code === 'no_cta')).toBe(true)
  })

  it('flags too many emojis', () => {
    const r = scoreCampaign({
      body: 'Big sale today 🎉🎉🎉🔥🔥🔥💥 reply to shop now with us',
    })
    expect(r.issues.some((i) => i.code === 'emoji_overload')).toBe(true)
    expect(r.metrics.emoji_count).toBeGreaterThan(5)
  })

  it('suggests personalization + opt-out for a plain marketing message', () => {
    const r = scoreCampaign({
      body: 'Come visit our store this weekend and shop the latest arrivals in person.',
      category: 'Marketing',
    })
    expect(r.issues.some((i) => i.code === 'no_personalization')).toBe(true)
    expect(r.improvements.join(' ')).toMatch(/opt-out|stop|unsubscribe/i)
  })

  it('is deterministic — same input, same output', () => {
    const input = { body: 'Hi {{1}}, reply YES to book your slot today.' }
    expect(scoreCampaign(input)).toEqual(scoreCampaign(input))
  })

  it('handles an empty body without throwing', () => {
    const r = scoreCampaign({ body: '' })
    expect(r.issues.some((i) => i.code === 'empty')).toBe(true)
    expect(r.score).toBeLessThan(60)
  })
})

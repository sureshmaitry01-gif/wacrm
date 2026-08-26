import { describe, expect, it } from 'vitest'
import {
  buildCampaignSystemPrompt,
  buildCampaignUserPrompt,
  isCampaignLanguage,
  parseCampaignOutput,
} from './campaign'

describe('isCampaignLanguage', () => {
  it('accepts the three supported modes only', () => {
    expect(isCampaignLanguage('en')).toBe(true)
    expect(isCampaignLanguage('hi')).toBe(true)
    expect(isCampaignLanguage('hinglish')).toBe(true)
    expect(isCampaignLanguage('fr')).toBe(false)
    expect(isCampaignLanguage(null)).toBe(false)
  })
})

describe('buildCampaignSystemPrompt', () => {
  it('instructs Devanagari for hi and Roman script for hinglish', () => {
    expect(buildCampaignSystemPrompt('hi')).toMatch(/Devanagari/)
    const hinglish = buildCampaignSystemPrompt('hinglish')
    expect(hinglish).toMatch(/Hinglish/)
    expect(hinglish).toMatch(/Latin\/Roman script/)
  })

  it('carries prompt-injection hardening and a strict JSON contract', () => {
    const p = buildCampaignSystemPrompt('en')
    expect(p).toMatch(/untrusted DATA/)
    expect(p).toMatch(/ONLY a JSON object/)
    expect(p).toMatch(/short_version/)
  })
})

describe('buildCampaignUserPrompt', () => {
  it('includes only the provided brief fields', () => {
    const p = buildCampaignUserPrompt({
      language: 'en',
      businessType: 'Sari shop',
      offer: 'Diwali 20% off',
    })
    expect(p).toMatch(/Sari shop/)
    expect(p).toMatch(/Diwali 20% off/)
    expect(p).not.toMatch(/Audience:/)
  })

  it('includes an existing draft when rewriting', () => {
    const p = buildCampaignUserPrompt({
      language: 'hinglish',
      existingDraft: 'Sale hai aao',
    })
    expect(p).toMatch(/Existing draft/)
    expect(p).toMatch(/Sale hai aao/)
  })

  it('produces a sensible prompt even with an empty brief', () => {
    const p = buildCampaignUserPrompt({ language: 'en' })
    expect(p).toMatch(/No details provided/)
  })
})

describe('parseCampaignOutput', () => {
  it('parses a clean JSON object', () => {
    const out = parseCampaignOutput(
      JSON.stringify({
        message: 'Hi {{1}}, big sale!',
        short_version: 'Big sale {{1}}!',
        cta_suggestions: ['Shop now', 'Reply YES'],
        variable_suggestions: ['{{1}} = customer name'],
        compliance_notes: ['Add opt-out'],
      }),
    )
    expect(out.message).toBe('Hi {{1}}, big sale!')
    expect(out.cta_suggestions).toEqual(['Shop now', 'Reply YES'])
    expect(out.compliance_notes).toEqual(['Add opt-out'])
  })

  it('strips a ```json fence', () => {
    const out = parseCampaignOutput(
      '```json\n{"message":"Hello","short_version":"","cta_suggestions":[],"variable_suggestions":[],"compliance_notes":[]}\n```',
    )
    expect(out.message).toBe('Hello')
  })

  it('extracts JSON embedded in surrounding prose', () => {
    const out = parseCampaignOutput(
      'Sure! Here you go: {"message":"Namaste {{1}}","short_version":"","cta_suggestions":[],"variable_suggestions":[],"compliance_notes":[]} — hope that helps.',
    )
    expect(out.message).toBe('Namaste {{1}}')
  })

  it('falls back to raw text as the message when not JSON', () => {
    const out = parseCampaignOutput('Just some plain text reply')
    expect(out.message).toBe('Just some plain text reply')
    expect(out.cta_suggestions).toEqual([])
  })

  it('coerces non-array/non-string fields to a safe shape', () => {
    const out = parseCampaignOutput(
      JSON.stringify({ message: 'Hi', cta_suggestions: 'not an array' }),
    )
    expect(out.cta_suggestions).toEqual([])
    expect(out.short_version).toBe('')
  })

  it('returns an empty, safe shape for empty input', () => {
    const out = parseCampaignOutput('')
    expect(out).toEqual({
      message: '',
      short_version: '',
      cta_suggestions: [],
      variable_suggestions: [],
      compliance_notes: [],
    })
  })
})

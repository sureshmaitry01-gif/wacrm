import { describe, expect, it } from 'vitest'
import {
  buildOnboardingSteps,
  firstIncompleteStep,
  onboardingProgress,
  ONBOARDING_STEP_ORDER,
  type OnboardingInput,
} from './steps'

const NOTHING: OnboardingInput = {
  whatsappConfigured: false,
  contactsExist: false,
  templatesExist: false,
  broadcastsExist: false,
}

const ALL: OnboardingInput = {
  whatsappConfigured: true,
  contactsExist: true,
  templatesExist: true,
  broadcastsExist: true,
}

describe('buildOnboardingSteps', () => {
  it('returns the four steps in the first-run order', () => {
    const steps = buildOnboardingSteps(NOTHING)
    expect(steps.map((s) => s.id)).toEqual(ONBOARDING_STEP_ORDER)
    expect(steps.map((s) => s.id)).toEqual([
      'whatsapp',
      'contacts',
      'template',
      'campaign',
    ])
  })

  it('maps each real-state flag to the matching step completion', () => {
    const steps = buildOnboardingSteps({
      whatsappConfigured: true,
      contactsExist: false,
      templatesExist: true,
      broadcastsExist: false,
    })
    const by = Object.fromEntries(steps.map((s) => [s.id, s.complete]))
    expect(by).toEqual({
      whatsapp: true,
      contacts: false,
      template: true,
      campaign: false,
    })
  })

  it('every step has an action route and CTA', () => {
    for (const step of buildOnboardingSteps(NOTHING)) {
      expect(step.href.startsWith('/')).toBe(true)
      expect(step.cta.length).toBeGreaterThan(0)
      expect(step.title.length).toBeGreaterThan(0)
    }
  })

  it('the template step surfaces Hinglish AI writing (India-first)', () => {
    const template = buildOnboardingSteps(NOTHING).find((s) => s.id === 'template')!
    expect(template.description).toMatch(/Hinglish/)
  })
})

describe('onboardingProgress', () => {
  it('is 0% when nothing is done', () => {
    const p = onboardingProgress(buildOnboardingSteps(NOTHING))
    expect(p).toMatchObject({ done: 0, total: 4, percent: 0, complete: false })
  })

  it('is 100% and complete when everything is done', () => {
    const p = onboardingProgress(buildOnboardingSteps(ALL))
    expect(p).toMatchObject({ done: 4, total: 4, percent: 100, complete: true })
  })

  it('reports partial progress', () => {
    const p = onboardingProgress(
      buildOnboardingSteps({ ...NOTHING, whatsappConfigured: true, contactsExist: true }),
    )
    expect(p.done).toBe(2)
    expect(p.percent).toBe(50)
    expect(p.complete).toBe(false)
  })
})

describe('firstIncompleteStep', () => {
  it('is the WhatsApp step for a brand-new account', () => {
    expect(firstIncompleteStep(buildOnboardingSteps(NOTHING))?.id).toBe('whatsapp')
  })

  it('skips completed steps to the next action', () => {
    const steps = buildOnboardingSteps({
      ...NOTHING,
      whatsappConfigured: true,
      contactsExist: true,
    })
    expect(firstIncompleteStep(steps)?.id).toBe('template')
  })

  it('is null once everything is complete', () => {
    expect(firstIncompleteStep(buildOnboardingSteps(ALL))).toBeNull()
  })
})

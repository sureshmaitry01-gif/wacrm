// ============================================================
// Onboarding step model (M06) — India-first first-run guidance.
//
// Pure + deterministic: given what the account has already done (all
// derived from existing rows — no new table, no migration), produce the
// ordered checklist, progress, and the next action. The dashboard card
// renders this; the data-fetching lives there.
//
// Copy is intentionally English and hardcoded (consistent with the M04/
// M05C campaign UI): the app has no per-user language switcher yet, and
// adding en.json keys would force ko.json parity. The India-first payload
// is the Hinglish AI *writing* surfaced in the template step, plus the
// plain-English INR / no-markup / approval explanations. Real Hindi UI
// localization is a separate future milestone (see docs).
// ============================================================

export type OnboardingStepId = 'whatsapp' | 'contacts' | 'template' | 'campaign'

/** What the account has already done — every field is derivable from
 *  existing account-scoped rows. */
export interface OnboardingInput {
  whatsappConfigured: boolean
  contactsExist: boolean
  templatesExist: boolean
  broadcastsExist: boolean
}

export interface OnboardingStep {
  id: OnboardingStepId
  title: string
  /** One-line, jargon-light explanation for an Indian SMB. */
  description: string
  /** Where the CTA sends them (existing routes only). */
  href: string
  cta: string
  complete: boolean
}

export interface OnboardingProgress {
  done: number
  total: number
  percent: number
  complete: boolean
}

// Step metadata (order = the natural first-run sequence). Copy avoids
// "bulk sender" framing and never implies the app can bypass WhatsApp's
// rules — it explains them simply instead.
const STEP_META: Record<
  OnboardingStepId,
  Omit<OnboardingStep, 'complete'>
> = {
  whatsapp: {
    id: 'whatsapp',
    title: 'Connect WhatsApp',
    description:
      'Link your WhatsApp Business number so you can message customers on the official WhatsApp API.',
    href: '/settings?tab=whatsapp',
    cta: 'Connect',
  },
  contacts: {
    id: 'contacts',
    title: 'Add your contacts',
    description:
      'Import a CSV or add customers by hand so you have people to reach.',
    href: '/contacts',
    cta: 'Add contacts',
  },
  template: {
    id: 'template',
    title: 'Create your first template',
    description:
      'Write a message with AI in English, हिंदी, or Hinglish. WhatsApp reviews marketing templates before they can be sent — usually within a few minutes.',
    href: '/settings?tab=templates',
    cta: 'Create template',
  },
  campaign: {
    id: 'campaign',
    title: 'Send your first campaign',
    description:
      'Pick a template, choose your audience, and see the estimated cost in ₹ before anything goes out.',
    href: '/broadcasts/new',
    cta: 'Start a campaign',
  },
}

/** The order steps appear in. */
export const ONBOARDING_STEP_ORDER: OnboardingStepId[] = [
  'whatsapp',
  'contacts',
  'template',
  'campaign',
]

/** Build the ordered checklist with completion flags from real state. */
export function buildOnboardingSteps(input: OnboardingInput): OnboardingStep[] {
  const completeById: Record<OnboardingStepId, boolean> = {
    whatsapp: input.whatsappConfigured,
    contacts: input.contactsExist,
    template: input.templatesExist,
    campaign: input.broadcastsExist,
  }
  return ONBOARDING_STEP_ORDER.map((id) => ({
    ...STEP_META[id],
    complete: completeById[id],
  }))
}

export function onboardingProgress(steps: OnboardingStep[]): OnboardingProgress {
  const total = steps.length
  const done = steps.filter((s) => s.complete).length
  return {
    done,
    total,
    percent: total === 0 ? 0 : Math.round((done / total) * 100),
    complete: total > 0 && done === total,
  }
}

/** The next thing to do — the first incomplete step, or null when done. */
export function firstIncompleteStep(
  steps: OnboardingStep[],
): OnboardingStep | null {
  return steps.find((s) => !s.complete) ?? null
}

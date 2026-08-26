import { CampaignError } from './errors'
import {
  getRateCard,
  type MessageCategory,
  type RateCard,
} from './meta-rate-card'

// ============================================================
// Campaign cost calculator — PURE and deterministic.
//
// Transparent "Meta cost + optional platform markup" math. Positioning is
// no-markup by default (platformMarkupPct defaults to 0): the customer's
// messages bill against their own WhatsApp account at Meta's rates, and we
// show that number honestly. This module never calls Meta and never sends.
// ============================================================

export interface CostInput {
  /** ISO alpha-2 country. Default 'IN'. */
  country?: string
  /** Meta pricing category. */
  category: MessageCategory
  /** Number of intended recipients (integer ≥ 0). */
  recipients: number
  /** Fraction 0..1 of recipients expected to receive the message. Meta
   *  bills per *delivered* message, so this scales the billable count.
   *  Default 1 (bill for every recipient — the conservative estimate). */
  deliveryRate?: number
  /** Platform markup percentage on top of Meta cost. Default 0
   *  (transparent, no-markup positioning). */
  platformMarkupPct?: number
  /** Optional tax (e.g. GST) percentage applied to (meta + markup).
   *  Default 0. */
  taxPct?: number
  /** Test/override seam — inject a rate card instead of the default set. */
  rateCard?: RateCard
}

export interface CostEstimate {
  country: string
  currency: string
  category: MessageCategory
  recipients: number
  /** recipients × deliveryRate, rounded — the count actually priced. */
  billable_messages: number
  rate_per_message: number
  meta_cost: number
  platform_markup: number
  tax: number
  estimated_total: number
  cost_per_recipient: number
  effective_from: string
  source: string
  /** false ⇒ rates unverified against Meta's live card. */
  verified: boolean
  /** Human-readable caveat, always present. */
  warning: string
}

/** Round money to 2dp without accumulating float error. */
function money(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100
}

/**
 * Estimate the cost of a WhatsApp campaign. Pure — throws `CampaignError`
 * on invalid input (unknown country/category, bad numbers) so the API can
 * return a clean 400.
 */
export function estimateCampaignCost(input: CostInput): CostEstimate {
  const country = (input.country ?? 'IN').trim().toUpperCase()
  const card = input.rateCard ?? getRateCard(country)
  if (!card) {
    throw new CampaignError(
      `No rate card for country '${country}'. Add one to meta-rate-card.ts.`,
      { code: 'unknown_country' },
    )
  }

  const rate = card.rates[input.category]
  if (rate === undefined) {
    throw new CampaignError(`Unknown message category '${input.category}'.`, {
      code: 'unknown_category',
    })
  }

  if (!Number.isInteger(input.recipients) || input.recipients < 0) {
    throw new CampaignError('recipients must be a non-negative integer.', {
      code: 'invalid_recipients',
    })
  }

  const deliveryRate = input.deliveryRate ?? 1
  if (deliveryRate < 0 || deliveryRate > 1) {
    throw new CampaignError('deliveryRate must be between 0 and 1.', {
      code: 'invalid_delivery_rate',
    })
  }

  const markupPct = input.platformMarkupPct ?? 0
  if (markupPct < 0) {
    throw new CampaignError('platformMarkupPct must be ≥ 0.', {
      code: 'invalid_markup',
    })
  }

  const taxPct = input.taxPct ?? 0
  if (taxPct < 0) {
    throw new CampaignError('taxPct must be ≥ 0.', { code: 'invalid_tax' })
  }

  const billable = Math.round(input.recipients * deliveryRate)
  const metaCost = money(billable * rate)
  const platformMarkup = money(metaCost * (markupPct / 100))
  const tax = money((metaCost + platformMarkup) * (taxPct / 100))
  const total = money(metaCost + platformMarkup + tax)
  const perRecipient = input.recipients > 0 ? money(total / input.recipients) : 0

  return {
    country: card.country,
    currency: card.currency,
    category: input.category,
    recipients: input.recipients,
    billable_messages: billable,
    rate_per_message: rate,
    meta_cost: metaCost,
    platform_markup: platformMarkup,
    tax,
    estimated_total: total,
    cost_per_recipient: perRecipient,
    effective_from: card.effective_from,
    source: card.source,
    verified: card.verified,
    warning: card.verified
      ? 'Estimate only. Meta bills per delivered message; actuals may differ.'
      : `Estimate only — rates are UNVERIFIED (effective ${card.effective_from}). Confirm against Meta's current official rate card before relying on this. Meta bills per delivered message; actuals may differ.`,
  }
}

// ============================================================
// Meta WhatsApp per-message rate card — EDITABLE / VERSIONED CONFIG.
//
// ⚠️ Meta's WhatsApp pricing changes over time and by country. These
// numbers are NOT a permanent source of truth. Each card carries a
// `source`, an `effective_from` date, and `verified: false` until someone
// has checked it against Meta's live rate card. The cost calculator
// surfaces a verification warning to the UI on every estimate.
//
// To update: add a NEW card (don't silently mutate an old one if you want
// history), bump `effective_from`, cite the `source`, and flip `verified`
// to true only after confirming against Meta's official pricing page.
//
// Pricing model: Meta bills per delivered *message* by category
// (marketing / utility / authentication). "service" (a free-form reply
// inside the 24h customer service window) is 0 here because MVP does not
// estimate service replies.
//
// ------------------------------------------------------------
// VERIFIED against official Meta documentation on 2026-08-28
// (developers.facebook.com/docs/whatsapp/pricing):
//   ✓ per-MESSAGE pricing (replaced conversation-based pricing on
//     2025-07-01) — matches this calculator's model,
//   ✓ charged on DELIVERY, not on send,
//   ✓ categories marketing / utility / authentication are billable;
//     service messages are free — matching `service: 0`,
//   ✓ Meta's current rate cards are "effective July 1, 2026", which is
//     exactly this card's `effective_from`.
//
// STILL UNVERIFIED (why `verified: false` stays): the exact India INR
// numbers below. Meta publishes them only through an interactive
// market/currency selector and gated rate-card CSV/PDF downloads, which
// could not be retrieved from public documentation. Note also that India
// rates changed on 2026-01-01 (marketing) and 2026-04-01
// (authentication-international), so these values must be re-checked
// against the live rate card before they can be trusted.
//
// TWO KNOWN ESTIMATOR LIMITATIONS (both make estimates CONSERVATIVE —
// they over-estimate, never under-quote):
//   1. Utility messages sent inside an open 24-hour customer service
//      window are FREE. This estimator prices every utility message as
//      billable, so a campaign that lands in open windows costs less than
//      quoted.
//   2. Volume tiers exist for utility and authentication (cheaper as
//      monthly volume grows; they do NOT apply to marketing). This
//      estimator applies a single flat rate per category and models no
//      tiers.
// ------------------------------------------------------------
// ============================================================

export type MessageCategory =
  | 'marketing'
  | 'utility'
  | 'authentication'
  | 'service'

export interface RateCard {
  /** ISO 3166-1 alpha-2 country code, uppercased (e.g. 'IN'). */
  country: string
  /** ISO 4217 currency of the rates below (e.g. 'INR'). */
  currency: string
  /** ISO date the rates took effect. */
  effective_from: string
  /** Where the numbers came from — cite Meta's rate card / a dated note. */
  source: string
  /** false until confirmed against Meta's live pricing. Drives the
   *  calculator's "unverified rates" warning. */
  verified: boolean
  /** Per-message price in `currency`, by category. */
  rates: Record<MessageCategory, number>
}

// India-first defaults. Values supplied for the M04 build; VERIFY against
// Meta's current official India rate card before production.
export const META_RATE_CARDS: RateCard[] = [
  {
    country: 'IN',
    currency: 'INR',
    effective_from: '2026-07-01',
    source:
      'M04 initial India defaults. M07A (2026-08-28): pricing MODEL, delivery-based billing, free service messages and the 2026-07-01 effective date are verified against developers.facebook.com/docs/whatsapp/pricing; the INR VALUES below remain UNVERIFIED (published only via a gated rate-card selector/CSV). Confirm against Meta\'s live India rate card before production.',
    verified: false,
    rates: {
      marketing: 0.8631,
      utility: 0.115,
      authentication: 0.115,
      service: 0, // not estimated in MVP
    },
  },
]

/** Look up the active rate card for a country (case-insensitive). Returns
 *  null for an unknown country so callers surface a clear error rather
 *  than guessing a price. */
export function getRateCard(
  country: string,
  cards: RateCard[] = META_RATE_CARDS,
): RateCard | null {
  const cc = country.trim().toUpperCase()
  return cards.find((c) => c.country === cc) ?? null
}

/** Categories we actually price/estimate (excludes 'service' for MVP). */
export const PRICED_CATEGORIES: MessageCategory[] = [
  'marketing',
  'utility',
  'authentication',
]

/** Map an app template category ('Marketing'|'Utility'|'Authentication')
 *  onto a Meta pricing category. */
export function categoryFromTemplate(
  templateCategory: string,
): MessageCategory | null {
  switch (templateCategory.trim().toLowerCase()) {
    case 'marketing':
      return 'marketing'
    case 'utility':
      return 'utility'
    case 'authentication':
      return 'authentication'
    case 'service':
      return 'service'
    default:
      return null
  }
}

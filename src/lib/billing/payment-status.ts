// ============================================================
// Payment-status → customer notice mapping (M07C, presentation only).
//
// Pure display logic: given the subscription status that ALREADY exists
// (set by the billing webhook / entitlement layer), decide whether to show
// a dunning notice and what it should say. This changes NO billing state,
// no webhook behavior, no entitlement/quota logic — it only renders around
// the existing status.
//
// Only the three customer-actionable problem states get a notice:
//   - failed / on_hold → a temporary payment issue (warning),
//   - expired          → service has lapsed (critical).
// Every other status (active, trialing, canceled, incomplete, …) → no
// notice.
// ============================================================

export type PaymentNoticeTone = 'warning' | 'critical'

export interface PaymentNotice {
  tone: PaymentNoticeTone
  title: string
  body: string
}

/**
 * Map a subscription status to a dunning notice, or `null` when nothing
 * needs the customer's attention. Copy is plain and non-alarming, and
 * distinguishes a temporary payment problem from an expired subscription.
 */
export function paymentNotice(status: string): PaymentNotice | null {
  switch (status) {
    case 'failed':
    case 'on_hold':
      return {
        tone: 'warning',
        title: 'Payment needs attention',
        body: "We couldn't process your last payment. Please update your payment method to keep your plan active.",
      }
    case 'expired':
      return {
        tone: 'critical',
        title: 'Your subscription has expired',
        body: 'Renew to restore your plan’s higher limits — until then your account uses the free-plan limits.',
      }
    default:
      return null
  }
}

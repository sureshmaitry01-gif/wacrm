import crypto from 'node:crypto'

import {
  dodoApiBaseUrl,
  dodoApiKey,
  dodoBillingCountry,
  dodoWebhookSecret,
  isDodoConfigured,
  planIdForDodoProduct,
} from '../config'
import { isPlanId, type PlanId } from '../plans'
import {
  BillingError,
  type BillingProvider,
  type CheckoutSession,
  type CreateCheckoutArgs,
  type NormalizedWebhookEvent,
  type ProviderSubscription,
  type SubscriptionStatus,
  type WebhookVerification,
} from '../types'

// ============================================================
// Dodo Payments adapter.
//
// DEPENDENCY-FREE ON PURPOSE. Dodo publishes an SDK, but everything we
// need here is one HMAC verification and two REST calls — adding an SDK
// would pull a transitive tree into a payments path for no functional
// gain, and would pin us to its release cadence. We use `fetch` +
// `node:crypto`, exactly as the repo already does for Meta webhooks
// (src/lib/whatsapp/webhook-signature.ts).
//
// ⚠️ VERIFY BEFORE PRODUCTION: Dodo's exact webhook header names and
// payload field names must be confirmed against your live Dodo dashboard
// (see docs/billing/DODO.md). The mapper below is deliberately defensive —
// it accepts several plausible field spellings and never throws on an
// unexpected shape — but the header/scheme assumptions are the one thing
// that must be checked against real deliveries before going live.
// ============================================================

const API_TIMEOUT_MS = 15_000

/** Dodo signs webhooks with the Standard Webhooks scheme (svix-style):
 *  `webhook-id`, `webhook-timestamp`, `webhook-signature`, where the
 *  signed payload is `<id>.<timestamp>.<body>`. We also accept the
 *  `svix-*` aliases, which the same scheme emits. */
function readSignatureHeaders(headers: Headers) {
  const id = headers.get('webhook-id') ?? headers.get('svix-id')
  const timestamp =
    headers.get('webhook-timestamp') ?? headers.get('svix-timestamp')
  const signature =
    headers.get('webhook-signature') ?? headers.get('svix-signature')
  return { id, timestamp, signature }
}

/** Standard Webhooks secrets are often prefixed `whsec_` and base64-
 *  encoded. Decode when prefixed; otherwise treat the value as raw. */
function secretKeyBytes(secret: string): Buffer {
  if (secret.startsWith('whsec_')) {
    return Buffer.from(secret.slice(6), 'base64')
  }
  return Buffer.from(secret)
}

/** Constant-time compare of two same-length strings. */
function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a)
  const bb = Buffer.from(b)
  if (ab.length !== bb.length) return false
  return crypto.timingSafeEqual(ab, bb)
}

/**
 * Map a raw Dodo event type onto our local subscription status.
 * Unrecognized types return `undefined` → the event is stored and acked
 * without mutating subscription state.
 */
export function statusForDodoEvent(
  type: string,
): SubscriptionStatus | null | undefined {
  switch (type) {
    case 'subscription.active':
    case 'subscription.renewed':
      return 'active'
    case 'subscription.on_hold':
      return 'on_hold'
    case 'subscription.cancelled':
    case 'subscription.canceled':
      return 'canceled'
    case 'subscription.expired':
      return 'expired'
    case 'subscription.failed':
      return 'failed'
    // These carry data but don't themselves imply a status change.
    case 'subscription.plan_changed':
    case 'subscription.updated':
    case 'payment.succeeded':
    case 'payment.failed':
      return null
    default:
      return undefined
  }
}

type Json = Record<string, unknown>

function asRecord(value: unknown): Json | null {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Json)
    : null
}

/** Read the first present string among several candidate keys. */
function pickString(obj: Json | null, ...keys: string[]): string | null {
  if (!obj) return null
  for (const k of keys) {
    const v = obj[k]
    if (typeof v === 'string' && v) return v
  }
  return null
}

export class DodoProvider implements BillingProvider {
  readonly name = 'dodo'

  isConfigured(): boolean {
    return isDodoConfigured()
  }

  /**
   * Verify the webhook HMAC. Fails CLOSED — a missing secret rejects every
   * request (same discipline as the Meta webhook), so a forgotten env var
   * can never leave a spoofable billing endpoint open.
   */
  verifyWebhookSignature(
    rawBody: string,
    headers: Headers,
  ): WebhookVerification {
    const secret = dodoWebhookSecret()
    if (!secret) {
      return { valid: false, reason: 'DODO_WEBHOOK_SECRET is not set' }
    }

    const { id, timestamp, signature } = readSignatureHeaders(headers)
    if (!id || !timestamp || !signature) {
      return { valid: false, reason: 'missing signature headers' }
    }

    const expected = crypto
      .createHmac('sha256', secretKeyBytes(secret))
      .update(`${id}.${timestamp}.${rawBody}`)
      .digest('base64')

    // The header may carry several space-separated versioned signatures
    // ("v1,<sig> v1,<sig2>"); a match on any one is a pass.
    const candidates = signature
      .split(' ')
      .map((part) => (part.includes(',') ? part.split(',')[1] : part))
      .filter(Boolean)

    for (const candidate of candidates) {
      if (safeEqual(candidate, expected)) return { valid: true }
    }
    return { valid: false, reason: 'signature mismatch' }
  }

  /**
   * Normalize a Dodo webhook body. Never throws — a malformed body yields
   * an `unknown` event, which the route stores and acks (a 500 here would
   * make Dodo retry forever).
   */
  mapWebhookEvent(rawBody: string): NormalizedWebhookEvent {
    let parsed: Json | null = null
    try {
      parsed = asRecord(JSON.parse(rawBody))
    } catch {
      parsed = null
    }

    const type =
      pickString(parsed, 'type', 'event_type', 'event') ?? 'unknown'
    const data =
      asRecord(parsed?.data) ?? asRecord(parsed?.object) ?? parsed ?? null
    const metadata = asRecord(data?.metadata)

    const mapped = statusForDodoEvent(type)
    const rawPlan = pickString(metadata, 'plan_id', 'planId')
    const productId = pickString(
      data,
      'product_id',
      'productId',
      'price_id',
      'priceId',
    )

    const planId: PlanId | null = isPlanId(rawPlan)
      ? rawPlan
      : planIdForDodoProduct(productId)

    const cancelAtPeriodEnd =
      typeof data?.cancel_at_period_end === 'boolean'
        ? (data.cancel_at_period_end as boolean)
        : typeof data?.cancelAtPeriodEnd === 'boolean'
          ? (data.cancelAtPeriodEnd as boolean)
          : null

    return {
      // Prefer the provider's event id; fall back to the webhook-id header
      // value the route passes through when the body omits one.
      id: pickString(parsed, 'id', 'event_id', 'webhook_id') ?? '',
      type,
      status: mapped ?? null,
      accountId: pickString(metadata, 'account_id', 'accountId'),
      providerSubscriptionId: pickString(
        data,
        'subscription_id',
        'subscriptionId',
        'id',
      ),
      providerCustomerId: pickString(data, 'customer_id', 'customerId'),
      planId,
      currentPeriodStart: pickString(
        data,
        'current_period_start',
        'previous_billing_date',
      ),
      currentPeriodEnd: pickString(
        data,
        'current_period_end',
        'next_billing_date',
      ),
      cancelAtPeriodEnd,
      unknown: mapped === undefined,
    }
  }

  async createCheckoutSession(
    args: CreateCheckoutArgs,
  ): Promise<CheckoutSession> {
    const key = dodoApiKey()
    if (!key) {
      throw new BillingError('Billing is not configured on this deployment.', {
        code: 'not_configured',
        status: 503,
      })
    }
    if (!args.productId) {
      throw new BillingError(
        `No Dodo product is configured for the '${args.planId}' plan.`,
        { code: 'missing_product', status: 400 },
      )
    }
    // Fail before the network call rather than letting Dodo 400: a
    // `customer` (with an email) is REQUIRED by the checkout contract, and
    // the caller resolves it server-side from the authenticated profile.
    if (!args.email || !args.email.trim()) {
      throw new BillingError(
        'A billing email is required to start checkout.',
        { code: 'missing_billing_email', status: 400 },
      )
    }

    let res: Response
    try {
      res = await fetch(`${dodoApiBaseUrl()}/subscriptions`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${key}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          product_id: args.productId,
          payment_link: true,
          return_url: args.successUrl,
          quantity: 1,
          // Echoed back on webhooks — this is how we attribute an event to
          // a tenant without trusting anything client-supplied.
          metadata: { account_id: args.accountId, plan_id: args.planId },
          // `customer` and `billing` are BOTH required by Dodo's
          // POST /subscriptions contract (verified 2026-08-28). Sending
          // the request without them returns 400. `email` is guaranteed
          // non-empty by the guard above; `name` is optional per the docs.
          customer: {
            email: args.email,
            ...(args.name ? { name: args.name } : {}),
          },
          // Country only — city/state/street/zipcode are optional and we
          // deliberately do not invent them. See dodoBillingCountry() for
          // why this is a deployment-level beta limitation.
          billing: { country: dodoBillingCountry() },
        }),
        signal: AbortSignal.timeout(API_TIMEOUT_MS),
        cache: 'no-store',
      })
    } catch {
      throw new BillingError('Could not reach the payment provider.', {
        code: 'network_error',
      })
    }

    if (!res.ok) {
      // Never echo the provider body — it can carry customer/PII detail.
      throw new BillingError(
        `Payment provider rejected the checkout request (${res.status}).`,
        { code: 'provider_error' },
      )
    }

    const body = asRecord(await res.json().catch(() => null))
    const url = pickString(body, 'payment_link', 'checkout_url', 'url')
    if (!url) {
      throw new BillingError('Payment provider did not return a checkout URL.', {
        code: 'invalid_response',
      })
    }
    return { url, id: pickString(body, 'subscription_id', 'id') ?? undefined }
  }

  async getSubscription(
    providerSubscriptionId: string,
  ): Promise<ProviderSubscription> {
    const key = dodoApiKey()
    if (!key) {
      throw new BillingError('Billing is not configured on this deployment.', {
        code: 'not_configured',
        status: 503,
      })
    }

    let res: Response
    try {
      res = await fetch(
        `${dodoApiBaseUrl()}/subscriptions/${encodeURIComponent(providerSubscriptionId)}`,
        {
          headers: { Authorization: `Bearer ${key}` },
          signal: AbortSignal.timeout(API_TIMEOUT_MS),
          cache: 'no-store',
        },
      )
    } catch {
      throw new BillingError('Could not reach the payment provider.', {
        code: 'network_error',
      })
    }
    if (!res.ok) {
      throw new BillingError(
        `Payment provider returned ${res.status} for the subscription lookup.`,
        { code: 'provider_error' },
      )
    }

    const data = asRecord(await res.json().catch(() => null))
    const rawStatus = pickString(data, 'status') ?? ''
    const status = statusForDodoEvent(`subscription.${rawStatus}`) ?? null

    return {
      providerSubscriptionId,
      providerCustomerId: pickString(data, 'customer_id', 'customerId'),
      status: status ?? 'incomplete',
      planId: planIdForDodoProduct(pickString(data, 'product_id', 'productId')),
      currentPeriodStart: pickString(data, 'previous_billing_date'),
      currentPeriodEnd: pickString(data, 'next_billing_date'),
      cancelAtPeriodEnd: data?.cancel_at_period_end === true,
    }
  }
}

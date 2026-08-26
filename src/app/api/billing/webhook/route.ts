import { NextResponse } from 'next/server'

import { supabaseAdmin } from '@/lib/billing/admin-client'
import { getBillingProvider } from '@/lib/billing/provider'
import type { NormalizedWebhookEvent } from '@/lib/billing/types'

/**
 * POST /api/billing/webhook — inbound Dodo Payments events.
 *
 * Shape mirrors the Meta webhook (src/app/api/whatsapp/webhook):
 *   1. Read the RAW body (signature is over raw bytes — parsing first
 *      would break verification).
 *   2. Verify the HMAC. Fails CLOSED: no secret ⇒ reject everything.
 *   3. Record the event by its provider id BEFORE mutating anything. The
 *      PK on `dodo_webhook_events.id` makes redelivery a no-op, so a
 *      retried event can't double-apply.
 *   4. Apply the subscription state change, if the event implies one.
 *
 * Always 200s on a *processing* failure after a valid signature: Dodo
 * retries non-2xx, and a poison event would otherwise loop forever. The
 * failure is persisted on the event row (status='error') for follow-up.
 * Signature failures DO return 401 — those should never be acked.
 *
 * Never logs secrets or full payloads.
 */
export async function POST(request: Request) {
  const raw = await request.text()
  const provider = getBillingProvider()

  const verification = provider.verifyWebhookSignature(raw, request.headers)
  if (!verification.valid) {
    console.error(`[billing webhook] rejected: ${verification.reason}`)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
  }

  const event = provider.mapWebhookEvent(raw)
  // Fall back to the transport's webhook id when the body carries none, so
  // idempotency always has a key.
  const eventId =
    event.id ||
    request.headers.get('webhook-id') ||
    request.headers.get('svix-id') ||
    ''
  if (!eventId) {
    console.error('[billing webhook] event has no id — cannot dedupe; ignoring')
    return NextResponse.json({ received: true, ignored: 'no_event_id' })
  }

  const admin = supabaseAdmin()

  // Idempotency gate: first writer wins. A redelivery conflicts and we ack
  // without reprocessing.
  const { data: inserted, error: insertErr } = await admin
    .from('dodo_webhook_events')
    .insert({
      id: eventId,
      event_type: event.type,
      account_id: event.accountId,
      status: 'received',
      payload: safePayload(raw),
    })
    .select('id')
    .maybeSingle()

  if (insertErr) {
    // Unique violation ⇒ already handled. Anything else: ack (Dodo
    // shouldn't retry forever) but leave a breadcrumb.
    if (insertErr.code === '23505') {
      return NextResponse.json({ received: true, duplicate: true })
    }
    console.error('[billing webhook] event insert failed:', insertErr.message)
    return NextResponse.json({ received: true, stored: false })
  }
  if (!inserted) {
    return NextResponse.json({ received: true, duplicate: true })
  }

  if (event.unknown) {
    await mark(admin, eventId, 'ignored')
    return NextResponse.json({ received: true, ignored: true })
  }

  try {
    const outcome = await applyEvent(admin, event)
    await mark(admin, eventId, outcome)
    return NextResponse.json({ received: true, applied: outcome === 'processed' })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'unknown error'
    console.error('[billing webhook] processing failed:', message)
    await mark(admin, eventId, 'error', message)
    // Ack: a poison event must not retry forever. The row records it.
    return NextResponse.json({ received: true, applied: false })
  }
}

type Admin = ReturnType<typeof supabaseAdmin>

async function mark(
  admin: Admin,
  id: string,
  status: 'processed' | 'unmatched' | 'error' | 'ignored',
  error?: string,
) {
  await admin
    .from('dodo_webhook_events')
    .update({ status, error: error ?? null, processed_at: new Date().toISOString() })
    .eq('id', id)
}

/**
 * Resolve the target account and apply the subscription change.
 *
 * Attribution order:
 *   1. `metadata.account_id` echoed back from checkout (authoritative — we
 *      set it), else
 *   2. an existing `subscriptions` row matching the provider subscription
 *      id (covers renewals, where metadata may not be echoed).
 */
async function applyEvent(
  admin: Admin,
  event: NormalizedWebhookEvent,
): Promise<'processed' | 'unmatched'> {
  let accountId = event.accountId

  if (!accountId && event.providerSubscriptionId) {
    const { data } = await admin
      .from('subscriptions')
      .select('account_id')
      .eq('dodo_subscription_id', event.providerSubscriptionId)
      .maybeSingle()
    accountId = (data?.account_id as string | undefined) ?? null
  }

  if (!accountId) return 'unmatched'

  // Only write fields this event actually carries — a partial event must
  // not blank out good state.
  const patch: Record<string, unknown> = {}
  if (event.status) patch.status = event.status
  if (event.planId) patch.plan_id = event.planId
  if (event.providerSubscriptionId)
    patch.dodo_subscription_id = event.providerSubscriptionId
  if (event.providerCustomerId) patch.dodo_customer_id = event.providerCustomerId
  if (event.currentPeriodStart) patch.current_period_start = event.currentPeriodStart
  if (event.currentPeriodEnd) patch.current_period_end = event.currentPeriodEnd
  if (event.cancelAtPeriodEnd !== null)
    patch.cancel_at_period_end = event.cancelAtPeriodEnd

  if (Object.keys(patch).length === 0) return 'processed'

  // Upsert on account_id: the seed trigger normally created the row, but
  // this keeps the webhook correct even if it didn't.
  const { error } = await admin
    .from('subscriptions')
    .upsert({ account_id: accountId, ...patch }, { onConflict: 'account_id' })

  if (error) throw new Error(error.message)

  if (event.providerCustomerId) {
    await admin.from('billing_customers').upsert(
      { account_id: accountId, dodo_customer_id: event.providerCustomerId },
      { onConflict: 'account_id' },
    )
  }

  return 'processed'
}

/**
 * Store the event body for audit, minus anything sensitive. We keep the
 * envelope + subscription-identifying fields, and deliberately drop
 * customer PII (email/name/address/phone) and any payment instrument
 * detail — a billing audit log should not become a PII store.
 */
function safePayload(raw: string): unknown {
  try {
    const parsed = JSON.parse(raw) as Record<string, unknown>
    const data = parsed?.data
    if (data && typeof data === 'object' && !Array.isArray(data)) {
      const scrubbed = { ...(data as Record<string, unknown>) }
      for (const key of [
        'customer',
        'billing',
        'email',
        'name',
        'phone',
        'phone_number',
        'card',
        'payment_method',
        'address',
      ]) {
        delete scrubbed[key]
      }
      return { ...parsed, data: scrubbed }
    }
    return parsed
  } catch {
    return null
  }
}

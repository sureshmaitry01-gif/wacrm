import { NextResponse } from 'next/server'

import { requireRole, toErrorResponse } from '@/lib/auth/account'
import { checkRateLimit, rateLimitResponse, RATE_LIMITS } from '@/lib/rate-limit'
import { dodoProductIdFor } from '@/lib/billing/config'
import { getBillingProvider } from '@/lib/billing/provider'
import { isPlanId } from '@/lib/billing/plans'
import { BillingError } from '@/lib/billing/types'

/**
 * POST /api/billing/checkout  (admin+)
 *
 * Starts a subscription checkout for a paid plan and returns the hosted
 * payment URL. Admin+ because it commits the account to a spend.
 *
 * The account_id is attached as provider metadata here (server-side) and
 * echoed back on webhooks — attribution never trusts client input.
 */
export async function POST(request: Request) {
  try {
    const { supabase, accountId, userId } = await requireRole('admin')

    const limit = await checkRateLimit(
      `billing-checkout:${userId}`,
      RATE_LIMITS.adminAction,
    )
    if (!limit.success) return rateLimitResponse(limit)

    const body = (await request.json().catch(() => null)) as {
      plan_id?: string
    } | null
    const planId = body?.plan_id
    if (!isPlanId(planId)) {
      return NextResponse.json({ error: 'Unknown plan' }, { status: 400 })
    }
    if (planId === 'free' || planId === 'enterprise') {
      return NextResponse.json(
        { error: `The '${planId}' plan is not purchasable through checkout.` },
        { status: 400 },
      )
    }

    const provider = getBillingProvider()
    if (!provider.isConfigured()) {
      return NextResponse.json(
        { error: 'Billing is not configured on this deployment.' },
        { status: 503 },
      )
    }

    const productId = dodoProductIdFor(planId)
    if (!productId) {
      return NextResponse.json(
        { error: `No product is configured for the '${planId}' plan.` },
        { status: 503 },
      )
    }

    const origin =
      process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '') ||
      new URL(request.url).origin

    // Billing contact, resolved SERVER-side from the caller's own profile
    // (RLS-scoped) — never from client input. Dodo requires a `customer`
    // with an email on checkout; failing here with a clear message beats a
    // provider 400.
    const { data: profile } = await supabase
      .from('profiles')
      .select('email, full_name')
      .eq('user_id', userId)
      .maybeSingle()

    const email = (profile?.email as string | undefined)?.trim()
    if (!email) {
      return NextResponse.json(
        {
          error:
            'Your profile has no email address, which the payment provider requires. Add one in Settings → Your profile and try again.',
          code: 'missing_billing_email',
        },
        { status: 400 },
      )
    }

    const session = await provider.createCheckoutSession({
      accountId,
      planId,
      productId,
      successUrl: `${origin}/settings?tab=billing&checkout=success`,
      cancelUrl: `${origin}/settings?tab=billing&checkout=cancelled`,
      email,
      name: (profile?.full_name as string | undefined)?.trim() || null,
    })

    return NextResponse.json({ url: session.url, id: session.id ?? null })
  } catch (err) {
    if (err instanceof BillingError) {
      return NextResponse.json(
        { error: err.message, code: err.code },
        { status: err.status },
      )
    }
    return toErrorResponse(err)
  }
}

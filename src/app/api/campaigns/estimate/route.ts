import { NextResponse } from 'next/server'

import { getCurrentAccount, toErrorResponse } from '@/lib/auth/account'
import { estimateCampaignCost } from '@/lib/campaigns/cost'
import { categoryFromTemplate, type MessageCategory } from '@/lib/campaigns/meta-rate-card'
import { CampaignError } from '@/lib/campaigns/errors'

/**
 * POST /api/campaigns/estimate
 *
 * Transparent Meta cost estimate for a campaign. Auth-scoped (any member).
 * Never sends and never calls Meta — pure math over the editable rate card.
 *
 * Body: {
 *   category: 'marketing'|'utility'|'authentication' | template category
 *             ('Marketing'|'Utility'|'Authentication'),
 *   recipients: number,
 *   country?, deliveryRate?, platformMarkupPct?, taxPct?
 * }
 */
export async function POST(request: Request) {
  try {
    // Auth only — estimates are cheap and read-only, so any member may run
    // one; we still require a session to keep it off the public surface.
    await getCurrentAccount()

    const body = (await request.json().catch(() => null)) as
      | Record<string, unknown>
      | null
    if (!body) {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
    }

    // Accept either a Meta category or an app template category.
    const rawCategory = String(body.category ?? '')
    const category = (categoryFromTemplate(rawCategory) ??
      rawCategory.toLowerCase()) as MessageCategory

    const estimate = estimateCampaignCost({
      category,
      recipients: Number(body.recipients),
      country: typeof body.country === 'string' ? body.country : undefined,
      deliveryRate:
        body.deliveryRate !== undefined ? Number(body.deliveryRate) : undefined,
      platformMarkupPct:
        body.platformMarkupPct !== undefined
          ? Number(body.platformMarkupPct)
          : undefined,
      taxPct: body.taxPct !== undefined ? Number(body.taxPct) : undefined,
    })

    return NextResponse.json(estimate)
  } catch (err) {
    if (err instanceof CampaignError) {
      return NextResponse.json(
        { error: err.message, code: err.code },
        { status: err.status },
      )
    }
    return toErrorResponse(err)
  }
}

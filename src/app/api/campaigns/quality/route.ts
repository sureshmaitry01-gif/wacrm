import { NextResponse } from 'next/server'

import { getCurrentAccount, toErrorResponse } from '@/lib/auth/account'
import { scoreCampaign, type TemplateCategory } from '@/lib/campaigns/quality'

/**
 * POST /api/campaigns/quality
 *
 * Deterministic campaign quality score (0–100 + grade, issues,
 * improvements, risk level). Auth-scoped, read-only, no AI, no spend — the
 * default path. AI-augmented suggestions are a documented follow-up (they
 * would run through the M03 platform runtime + credit quota); deterministic
 * output is sufficient for M04.
 *
 * Body: { body: string, category?, buttons?, footer? }
 */
export async function POST(request: Request) {
  try {
    await getCurrentAccount()

    const body = (await request.json().catch(() => null)) as
      | Record<string, unknown>
      | null
    if (!body || typeof body.body !== 'string') {
      return NextResponse.json(
        { error: '`body` (the message text) is required' },
        { status: 400 },
      )
    }

    const category =
      body.category === 'Marketing' ||
      body.category === 'Utility' ||
      body.category === 'Authentication'
        ? (body.category as TemplateCategory)
        : undefined

    const buttons = Array.isArray(body.buttons)
      ? (body.buttons as { type?: string; text?: string }[])
      : undefined

    const result = scoreCampaign({
      body: body.body,
      category,
      buttons,
      footer: typeof body.footer === 'string' ? body.footer : undefined,
    })

    return NextResponse.json(result)
  } catch (err) {
    return toErrorResponse(err)
  }
}

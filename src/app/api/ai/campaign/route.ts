import { NextResponse } from 'next/server'

import { requireRole, toErrorResponse } from '@/lib/auth/account'
import { checkRateLimit, rateLimitResponse, RATE_LIMITS } from '@/lib/rate-limit'
import { resolveAiRuntime } from '@/lib/ai/runtime'
import { generateReply } from '@/lib/ai/generate'
import { logAiUsage } from '@/lib/ai/usage'
import { supabaseAdmin } from '@/lib/ai/admin-client'
import { AiError } from '@/lib/ai/types'
import {
  buildCampaignSystemPrompt,
  buildCampaignUserPrompt,
  isCampaignLanguage,
  parseCampaignOutput,
  type CampaignLanguage,
} from '@/lib/ai/campaign'
import { consumeQuota, upgradeRequiredResponse } from '@/lib/billing/entitlements'

/**
 * POST /api/ai/campaign  (agent+)
 *
 * AI campaign writer / Hindi-Hinglish rewriter. Drafts campaign copy from a
 * business brief using the M03 platform AI (DeepSeek) or a BYO key. Never
 * sends — the user reviews before use.
 *
 * Platform-mode calls consume 1 AI credit before the provider call (402 on
 * exceed); BYO callers pay their own provider and aren't metered here.
 * Language (en | hi | hinglish) is a MODE of this endpoint.
 */
export async function POST(request: Request) {
  try {
    const { supabase, accountId, userId } = await requireRole('agent')

    const userLimit = await checkRateLimit(`ai-campaign:${userId}`, RATE_LIMITS.aiDraft)
    if (!userLimit.success) return rateLimitResponse(userLimit)
    const acctLimit = await checkRateLimit(
      `ai-campaign-acct:${accountId}`,
      RATE_LIMITS.aiDraftAccount,
    )
    if (!acctLimit.success) return rateLimitResponse(acctLimit)

    const body = (await request.json().catch(() => null)) as
      | Record<string, unknown>
      | null
    if (!body) {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
    }

    const language: CampaignLanguage = isCampaignLanguage(body.language)
      ? body.language
      : 'en'
    const str = (v: unknown) => (typeof v === 'string' ? v : undefined)
    const category =
      body.template_category === 'Marketing' ||
      body.template_category === 'Utility' ||
      body.template_category === 'Authentication'
        ? (body.template_category as 'Marketing' | 'Utility' | 'Authentication')
        : undefined

    const writerInput = {
      businessType: str(body.business_type),
      audience: str(body.audience),
      offer: str(body.offer),
      goal: str(body.campaign_goal),
      tone: str(body.tone),
      language,
      existingDraft: str(body.existing_draft),
      templateCategory: category,
    }

    const runtime = await resolveAiRuntime(supabase, accountId).catch((err) => {
      console.error('[ai/campaign] resolveAiRuntime error:', err)
      throw new AiError('Stored API key could not be decrypted.', {
        code: 'key_decrypt_failed',
        status: 400,
      })
    })
    if (!runtime) {
      return NextResponse.json(
        {
          error: 'AI is not set up. Enable platform AI or add a key in Settings → AI Assistant.',
          code: 'ai_not_configured',
        },
        { status: 400 },
      )
    }
    const { config, mode } = runtime

    // Meter platform AI before spending the platform key.
    if (mode === 'platform') {
      const credit = await consumeQuota(supabase, accountId, 'ai_monthly_credits_limit', 1)
      if (!credit.allowed) return upgradeRequiredResponse(credit)
    }

    const systemPrompt = buildCampaignSystemPrompt(language)
    const userPrompt = buildCampaignUserPrompt(writerInput)

    const { text, usage } = await generateReply({
      config,
      systemPrompt,
      messages: [{ role: 'user', content: userPrompt }],
    })

    // Usage logged under the existing 'draft' mode (a writer draw is a
    // draft-class action) — no schema change. Fire-and-forget, service role.
    try {
      void logAiUsage(supabaseAdmin(), {
        accountId,
        conversationId: null,
        mode: 'draft',
        provider: config.provider,
        model: config.model,
        usage,
      })
    } catch (logErr) {
      console.error('[ai/campaign] usage log skipped:', logErr)
    }

    return NextResponse.json({ language, ...parseCampaignOutput(text) })
  } catch (err) {
    if (err instanceof AiError) {
      return NextResponse.json(
        { error: err.message, code: err.code },
        { status: err.status },
      )
    }
    return toErrorResponse(err)
  }
}

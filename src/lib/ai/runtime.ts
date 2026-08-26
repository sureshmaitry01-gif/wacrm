import type { SupabaseClient } from '@supabase/supabase-js'

import { loadAiConfig } from './config'
import { isPlatformAiConfigured, platformDeepSeekConfig } from './platform'
import type { AiConfig } from './types'

// ============================================================
// AI runtime resolution — which AI serves this account, this request.
//
// Central place that decides platform vs BYO, so the rule lives in ONE
// spot instead of scattered conditionals across the draft / auto-reply
// paths.
//
// Rule (platform-first for normal SaaS accounts):
//   1. If the account has an ACTIVE bring-your-own-key config
//      (`ai_configs.is_active`), use it — mode 'byok'. This preserves
//      every existing behavior and is the escape hatch for enterprise /
//      self-host / advanced users who paste their own OpenAI/Anthropic key.
//   2. Otherwise, if platform AI (DeepSeek) is configured, use it —
//      mode 'platform'. This is the default for the normal SaaS user who
//      never touches the BYO settings.
//   3. Otherwise, no AI is available (null).
//
// Only 'platform' mode is metered against the plan's AI credit quota —
// BYO callers pay their own provider directly, so we don't meter them.
//
// UX follow-up (documented, out of M03 scope): there is no per-account
// toggle to *force* platform when a BYO key also exists, nor per-account
// platform auto-reply settings. Both need a settings surface + schema and
// are deferred.
// ============================================================

export type AiMode = 'platform' | 'byok'

export interface AiRuntime {
  config: AiConfig
  mode: AiMode
}

/**
 * Resolve the effective AI runtime for an account. `opts.requireActive`
 * is forwarded to the BYO loader (the playground passes false to test a
 * not-yet-activated key); it does not affect platform resolution.
 *
 * Never throws for the "not configured" case — returns null so callers can
 * surface a clean message.
 */
export async function resolveAiRuntime(
  db: SupabaseClient,
  accountId: string,
  opts: { requireActive?: boolean } = {},
): Promise<AiRuntime | null> {
  const byo = await loadAiConfig(db, accountId, opts)
  if (byo) return { config: byo, mode: 'byok' }

  if (isPlatformAiConfigured()) {
    return { config: platformDeepSeekConfig(), mode: 'platform' }
  }

  return null
}

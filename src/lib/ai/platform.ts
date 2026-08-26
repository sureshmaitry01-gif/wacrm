import { AiError, type AiConfig } from './types'

// ============================================================
// Platform AI configuration (DeepSeek).
//
// The hosted SaaS provides AI centrally on a server-side key, rather than
// each account bringing its own. This module builds the in-memory
// `AiConfig` the generation layer consumes, from env — there is NO
// per-account row and NO client exposure of the key.
//
// BYO (openai/anthropic) still works unchanged; the runtime resolver
// (runtime.ts) decides which applies per account.
// ============================================================

/** Official DeepSeek model id for the first platform provider. Overridable
 *  via env because model ids churn. */
const DEFAULT_DEEPSEEK_MODEL = 'deepseek-v4-flash'

/** DeepSeek's OpenAI-compatible API host. Overridable for a proxy / a
 *  future region-specific host. The adapter appends `/chat/completions`. */
const DEFAULT_DEEPSEEK_BASE_URL = 'https://api.deepseek.com'

/** True when the platform DeepSeek key is present. Everything platform-AI
 *  is a no-op / clear config error when this is false, so local dev and
 *  self-host without a DeepSeek key keep working. */
export function isPlatformAiConfigured(): boolean {
  return Boolean(process.env.DEEPSEEK_API_KEY)
}

export function platformDeepSeekModel(): string {
  const m = process.env.DEEPSEEK_MODEL?.trim()
  return m || DEFAULT_DEEPSEEK_MODEL
}

export function deepSeekBaseUrl(): string {
  const b = process.env.DEEPSEEK_BASE_URL?.trim()
  return (b || DEFAULT_DEEPSEEK_BASE_URL).replace(/\/$/, '')
}

/**
 * Build the platform `AiConfig`. Throws a typed config error when the key
 * is missing — callers should gate on `isPlatformAiConfigured()` first and
 * surface "AI not configured" rather than reaching here.
 *
 * Auto-reply settings default OFF: platform accounts have no per-account
 * auto-reply configuration surface yet (a follow-up), so platform AI drives
 * the user-triggered draft path only; the background bot stays inert unless
 * an account has an explicit BYO config that enables it.
 */
export function platformDeepSeekConfig(): AiConfig {
  const apiKey = process.env.DEEPSEEK_API_KEY
  if (!apiKey) {
    throw new AiError('Platform AI is not configured on this deployment.', {
      code: 'ai_not_configured',
      status: 503,
    })
  }
  return {
    provider: 'deepseek',
    model: platformDeepSeekModel(),
    apiKey,
    systemPrompt: null,
    isActive: true,
    autoReplyEnabled: false,
    autoReplyMaxPerConversation: 3,
    handoffAgentId: null,
    embeddingsApiKey: null,
  }
}

import { AiError, type ProviderResult } from '../types'
import { MAX_OUTPUT_TOKENS } from '../defaults'
import { deepSeekBaseUrl } from '../platform'
import {
  mergeConsecutive,
  normalizeUsage,
  providerHttpError,
  toNetworkError,
  type ProviderArgs,
} from './shared'

// ============================================================
// DeepSeek adapter — the platform AI provider.
//
// DeepSeek exposes an OpenAI-compatible Chat Completions API, so the
// request/response shape mirrors the OpenAI adapter. Kept as its own file
// (rather than folded into openai.ts) so the platform provider's URL/param
// differences (`max_tokens`, configurable base URL) can't perturb the BYO
// OpenAI path or its tests.
// ============================================================

interface DeepSeekResponse {
  choices?: { message?: { content?: string } }[]
  usage?: {
    prompt_tokens?: number
    completion_tokens?: number
    total_tokens?: number
  }
}

/**
 * Call DeepSeek's OpenAI-compatible chat endpoint with the platform key.
 * Returns raw assistant text + token usage; handoff parsing happens in
 * `generateReply`, exactly like the other adapters.
 */
export async function generateDeepSeek(
  args: ProviderArgs,
): Promise<ProviderResult> {
  const { apiKey, model, systemPrompt, messages, timeoutMs } = args
  const url = `${deepSeekBaseUrl()}/chat/completions`

  let res: Response
  try {
    res = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: systemPrompt },
          ...mergeConsecutive(messages),
        ],
        // DeepSeek's OpenAI-compatible API uses `max_tokens` (not the newer
        // `max_completion_tokens`).
        max_tokens: MAX_OUTPUT_TOKENS,
      }),
      signal: AbortSignal.timeout(timeoutMs),
    })
  } catch (err) {
    throw toNetworkError(err)
  }

  if (!res.ok) {
    throw await providerHttpError('DeepSeek', res)
  }

  const data = (await res.json().catch(() => null)) as DeepSeekResponse | null
  const text = data?.choices?.[0]?.message?.content
  if (!text || typeof text !== 'string' || !text.trim()) {
    throw new AiError('DeepSeek returned an empty response.', {
      code: 'empty_response',
    })
  }
  const usage = normalizeUsage({
    prompt: data?.usage?.prompt_tokens,
    completion: data?.usage?.completion_tokens,
    total: data?.usage?.total_tokens,
  })
  return { text, usage }
}

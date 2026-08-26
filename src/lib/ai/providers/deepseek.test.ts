import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { generateDeepSeek } from './deepseek'
import { AiError } from '../types'

function okResponse(json: unknown): Response {
  return { ok: true, status: 200, json: async () => json } as unknown as Response
}
function errResponse(status: number, json: unknown): Response {
  return { ok: false, status, json: async () => json } as unknown as Response
}

const ARGS = {
  apiKey: 'ds-test-key',
  model: 'deepseek-v4-flash',
  systemPrompt: 'be helpful',
  messages: [{ role: 'user' as const, content: 'hi' }],
  timeoutMs: 30_000,
}

beforeEach(() => {
  vi.stubGlobal('fetch', vi.fn())
  delete process.env.DEEPSEEK_BASE_URL
})
afterEach(() => {
  vi.unstubAllGlobals()
  delete process.env.DEEPSEEK_BASE_URL
})

describe('generateDeepSeek', () => {
  it('posts OpenAI-compatible chat completions with a bearer key + max_tokens', async () => {
    const fetchMock = vi
      .mocked(fetch)
      .mockResolvedValue(
        okResponse({
          choices: [{ message: { content: 'Hello!' } }],
          usage: { prompt_tokens: 5, completion_tokens: 2, total_tokens: 7 },
        }),
      )

    const result = await generateDeepSeek(ARGS)
    expect(result.text).toBe('Hello!')
    expect(result.usage).toEqual({
      promptTokens: 5,
      completionTokens: 2,
      totalTokens: 7,
    })

    const [url, init] = fetchMock.mock.calls[0]
    expect(String(url)).toBe('https://api.deepseek.com/chat/completions')
    const headers = (init as RequestInit).headers as Record<string, string>
    expect(headers.Authorization).toBe('Bearer ds-test-key')
    const body = JSON.parse((init as RequestInit).body as string)
    expect(body.model).toBe('deepseek-v4-flash')
    expect(body.max_tokens).toBeGreaterThan(0)
    // System prompt is first, then the merged conversation.
    expect(body.messages[0]).toEqual({ role: 'system', content: 'be helpful' })
    expect(body.messages[1]).toEqual({ role: 'user', content: 'hi' })
  })

  it('honors a DEEPSEEK_BASE_URL override (trailing slash trimmed)', async () => {
    process.env.DEEPSEEK_BASE_URL = 'https://proxy.example.com/'
    const fetchMock = vi
      .mocked(fetch)
      .mockResolvedValue(okResponse({ choices: [{ message: { content: 'ok' } }] }))
    await generateDeepSeek(ARGS)
    expect(String(fetchMock.mock.calls[0][0])).toBe(
      'https://proxy.example.com/chat/completions',
    )
  })

  it('throws an invalid_key AiError on 401', async () => {
    vi.mocked(fetch).mockResolvedValue(
      errResponse(401, { error: { message: 'bad key' } }),
    )
    await expect(generateDeepSeek(ARGS)).rejects.toMatchObject({
      name: 'AiError',
      code: 'invalid_key',
    })
  })

  it('throws empty_response when the model returns no text', async () => {
    vi.mocked(fetch).mockResolvedValue(
      okResponse({ choices: [{ message: { content: '   ' } }] }),
    )
    await expect(generateDeepSeek(ARGS)).rejects.toMatchObject({
      code: 'empty_response',
    })
  })

  it('maps a network failure to a typed AiError', async () => {
    vi.mocked(fetch).mockRejectedValue(new Error('offline'))
    await expect(generateDeepSeek(ARGS)).rejects.toBeInstanceOf(AiError)
  })
})

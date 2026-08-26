import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { AiConfig } from './types'

const h = vi.hoisted(() => ({ loadAiConfig: vi.fn() }))
vi.mock('./config', () => ({ loadAiConfig: h.loadAiConfig }))

import { resolveAiRuntime } from './runtime'

const db = {} as SupabaseClient

function byoConfig(): AiConfig {
  return {
    provider: 'openai',
    model: 'gpt-test',
    apiKey: 'sk-test',
    systemPrompt: null,
    isActive: true,
    autoReplyEnabled: false,
    autoReplyMaxPerConversation: 3,
    handoffAgentId: null,
    embeddingsApiKey: null,
  }
}

beforeEach(() => {
  h.loadAiConfig.mockReset()
  delete process.env.DEEPSEEK_API_KEY
  delete process.env.DEEPSEEK_MODEL
})
afterEach(() => {
  delete process.env.DEEPSEEK_API_KEY
  delete process.env.DEEPSEEK_MODEL
})

describe('resolveAiRuntime', () => {
  it('uses BYO when an active account config exists — even if platform is configured', async () => {
    process.env.DEEPSEEK_API_KEY = 'ds-key'
    h.loadAiConfig.mockResolvedValue(byoConfig())

    const runtime = await resolveAiRuntime(db, 'acc-1')
    expect(runtime?.mode).toBe('byok')
    expect(runtime?.config.provider).toBe('openai')
  })

  it('falls back to platform DeepSeek when there is no BYO config', async () => {
    process.env.DEEPSEEK_API_KEY = 'ds-key'
    process.env.DEEPSEEK_MODEL = 'deepseek-v4-flash'
    h.loadAiConfig.mockResolvedValue(null)

    const runtime = await resolveAiRuntime(db, 'acc-1')
    expect(runtime?.mode).toBe('platform')
    expect(runtime?.config.provider).toBe('deepseek')
    expect(runtime?.config.model).toBe('deepseek-v4-flash')
    expect(runtime?.config.apiKey).toBe('ds-key')
  })

  it('returns null when neither BYO nor platform is configured', async () => {
    h.loadAiConfig.mockResolvedValue(null)
    expect(await resolveAiRuntime(db, 'acc-1')).toBeNull()
  })

  it('forwards requireActive to the BYO loader', async () => {
    h.loadAiConfig.mockResolvedValue(null)
    await resolveAiRuntime(db, 'acc-1', { requireActive: false })
    expect(h.loadAiConfig).toHaveBeenCalledWith(db, 'acc-1', {
      requireActive: false,
    })
  })
})

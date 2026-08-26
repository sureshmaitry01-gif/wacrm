import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { AiConfig } from './types'

// Platform-mode auto-reply: proves the AI-credit quota is consumed BEFORE
// the provider call and that an exhausted quota skips generation entirely
// (the inbound is left for a human — never a customer-facing error).
//
// Mocks the runtime resolver to return a *platform* DeepSeek runtime with
// auto-reply enabled (the real platform config defaults auto-reply off,
// which is a separate safety gate), so the quota path is exercised.

const h = vi.hoisted(() => ({
  resolveAiRuntime: vi.fn(),
  consumeQuota: vi.fn(),
  buildConversationContext: vi.fn(),
  retrieveKnowledge: vi.fn(),
  generateReply: vi.fn(),
  engineSendText: vi.fn(),
  state: {
    conv: {
      assigned_agent_id: null,
      ai_autoreply_disabled: false,
      ai_reply_count: 0,
    } as Record<string, unknown> | null,
    claim: true as boolean,
  },
}))

vi.mock('./runtime', () => ({ resolveAiRuntime: h.resolveAiRuntime }))
vi.mock('@/lib/billing/entitlements', () => ({ consumeQuota: h.consumeQuota }))
vi.mock('./context', () => ({ buildConversationContext: h.buildConversationContext }))
vi.mock('./knowledge', () => ({ retrieveKnowledge: h.retrieveKnowledge }))
vi.mock('./generate', () => ({ generateReply: h.generateReply }))
vi.mock('@/lib/flows/meta-send', () => ({ engineSendText: h.engineSendText }))
vi.mock('./admin-client', () => ({
  supabaseAdmin: () => ({
    from: (table: string) => {
      if (table === 'automations') {
        const chain = {
          select: () => chain,
          eq: () => chain,
          in: () => chain,
          limit: () => Promise.resolve({ data: [], error: null }),
        }
        return chain
      }
      return {
        select: () => ({
          eq: () => ({
            maybeSingle: () => Promise.resolve({ data: h.state.conv, error: null }),
          }),
        }),
        update: () => ({ eq: () => Promise.resolve({ error: null }) }),
      }
    },
    rpc: () => Promise.resolve({ data: h.state.claim, error: null }),
  }),
}))

import { dispatchInboundToAiReply } from './auto-reply'

const ARGS = {
  accountId: 'acct-1',
  conversationId: 'conv-1',
  contactId: 'contact-1',
  configOwnerUserId: 'user-1',
}

function platformConfig(): AiConfig {
  return {
    provider: 'deepseek',
    model: 'deepseek-v4-flash',
    apiKey: 'ds-key',
    systemPrompt: null,
    isActive: true,
    autoReplyEnabled: true,
    autoReplyMaxPerConversation: 3,
    handoffAgentId: null,
    embeddingsApiKey: null,
  }
}

beforeEach(() => {
  vi.clearAllMocks()
  h.state.conv = {
    assigned_agent_id: null,
    ai_autoreply_disabled: false,
    ai_reply_count: 0,
  }
  h.resolveAiRuntime.mockResolvedValue({ config: platformConfig(), mode: 'platform' })
  h.buildConversationContext.mockResolvedValue([{ role: 'user', content: 'hi' }])
  h.retrieveKnowledge.mockResolvedValue([])
  h.generateReply.mockResolvedValue({ text: 'Hello!', handoff: false, usage: null })
})

describe('platform auto-reply credit metering', () => {
  it('consumes a credit before generating, then sends when allowed', async () => {
    h.consumeQuota.mockResolvedValue({ allowed: true, used: 1, limit: 50 })

    await dispatchInboundToAiReply(ARGS)

    expect(h.consumeQuota).toHaveBeenCalledWith(
      expect.anything(),
      'acct-1',
      'ai_monthly_credits_limit',
      1,
    )
    expect(h.generateReply).toHaveBeenCalledOnce()
    expect(h.engineSendText).toHaveBeenCalledOnce()
  })

  it('skips generation and sends nothing when the credit quota is exhausted', async () => {
    h.consumeQuota.mockResolvedValue({ allowed: false, used: 50, limit: 50 })

    await dispatchInboundToAiReply(ARGS)

    expect(h.consumeQuota).toHaveBeenCalledOnce()
    expect(h.generateReply).not.toHaveBeenCalled()
    expect(h.engineSendText).not.toHaveBeenCalled()
  })
})

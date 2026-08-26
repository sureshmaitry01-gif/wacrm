import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import {
  deepSeekBaseUrl,
  isPlatformAiConfigured,
  platformDeepSeekConfig,
  platformDeepSeekModel,
} from './platform'
import { AiError } from './types'

const ENV_KEYS = ['DEEPSEEK_API_KEY', 'DEEPSEEK_MODEL', 'DEEPSEEK_BASE_URL']

function clearEnv() {
  for (const k of ENV_KEYS) delete process.env[k]
}

beforeEach(clearEnv)
afterEach(clearEnv)

describe('isPlatformAiConfigured', () => {
  it('is false without a key (local dev keeps working)', () => {
    expect(isPlatformAiConfigured()).toBe(false)
  })
  it('is true once DEEPSEEK_API_KEY is set', () => {
    process.env.DEEPSEEK_API_KEY = 'ds-key'
    expect(isPlatformAiConfigured()).toBe(true)
  })
})

describe('platformDeepSeekModel', () => {
  it('defaults to deepseek-v4-flash', () => {
    expect(platformDeepSeekModel()).toBe('deepseek-v4-flash')
  })
  it('honors DEEPSEEK_MODEL', () => {
    process.env.DEEPSEEK_MODEL = 'deepseek-v9-turbo'
    expect(platformDeepSeekModel()).toBe('deepseek-v9-turbo')
  })
})

describe('deepSeekBaseUrl', () => {
  it('defaults to the official host', () => {
    expect(deepSeekBaseUrl()).toBe('https://api.deepseek.com')
  })
  it('honors an override and trims a trailing slash', () => {
    process.env.DEEPSEEK_BASE_URL = 'https://proxy.test/'
    expect(deepSeekBaseUrl()).toBe('https://proxy.test')
  })
})

describe('platformDeepSeekConfig', () => {
  it('throws a config error when the key is missing', () => {
    expect(() => platformDeepSeekConfig()).toThrow(AiError)
  })

  it('builds a deepseek AiConfig from env with auto-reply off by default', () => {
    process.env.DEEPSEEK_API_KEY = 'ds-key'
    process.env.DEEPSEEK_MODEL = 'deepseek-v4-flash'
    const config = platformDeepSeekConfig()
    expect(config.provider).toBe('deepseek')
    expect(config.model).toBe('deepseek-v4-flash')
    expect(config.apiKey).toBe('ds-key')
    expect(config.isActive).toBe(true)
    expect(config.autoReplyEnabled).toBe(false)
    expect(config.embeddingsApiKey).toBeNull()
  })
})

// ============================================================
// Deterministic campaign quality score — PURE and testable.
//
// Scores a WhatsApp template/campaign body 0–100 with concrete, rule-based
// issues and improvements. No AI, no randomness: the same input always
// yields the same result, which makes it cheap, instant, and unit-testable.
// AI-augmented suggestions are a separate, optional layer (see
// /api/campaigns/quality docs) — never required.
// ============================================================

export type TemplateCategory = 'Marketing' | 'Utility' | 'Authentication'

export interface QualityInput {
  /** The template body text (may contain {{1}} style variables). */
  body: string
  /** App template category, if known — tunes category-fit checks. */
  category?: TemplateCategory
  /** Interactive buttons, if any — presence counts as a clear CTA. */
  buttons?: { type?: string; text?: string }[]
  /** Footer text, if any (opt-out language often lives here). */
  footer?: string
}

export type Severity = 'low' | 'medium' | 'high'
export type RiskLevel = 'low' | 'medium' | 'high'
export type Grade = 'A' | 'B' | 'C' | 'D' | 'F'

export interface QualityIssue {
  code: string
  severity: Severity
  message: string
}

export interface QualityMetrics {
  length: number
  emoji_count: number
  caps_ratio: number
  url_count: number
  phone_count: number
  variable_count: number
  spam_word_hits: string[]
}

export interface QualityResult {
  score: number
  grade: Grade
  risk_level: RiskLevel
  issues: QualityIssue[]
  improvements: string[]
  metrics: QualityMetrics
}

// Tuning constants — kept together so thresholds are easy to see/edit.
const MIN_LENGTH = 20
const MAX_LENGTH = 1024 // Meta body limit
const LONG_LENGTH = 700 // soft "getting long" threshold
const MAX_EMOJIS = 5
const MAX_URLS = 2
const MAX_PHONES = 1
const CAPS_RATIO_LIMIT = 0.4

// Common promotional/spam trigger phrases (lowercased, matched as words/
// phrases). Not exhaustive — a signal, not a filter.
const SPAM_WORDS = [
  'free',
  'winner',
  'won',
  'cash',
  'prize',
  'guaranteed',
  'guarantee',
  'act now',
  'urgent',
  'limited time',
  'click here',
  'congratulations',
  'risk-free',
  'risk free',
  '100%',
  'buy now',
  'order now',
  'cheap',
  'discount',
  'offer expires',
  'earn money',
  'double your',
]

const CTA_HINTS = [
  'shop',
  'buy',
  'order',
  'book',
  'call',
  'reply',
  'visit',
  'register',
  'sign up',
  'signup',
  'claim',
  'get',
  'download',
  'learn more',
  'view',
  'apply',
  'join',
  'contact',
  'whatsapp',
]

// Emoji detection via Unicode property escapes (no external dep).
const EMOJI_RE = /\p{Extended_Pictographic}/gu
const VARIABLE_RE = /\{\{\s*\d+\s*\}\}/g
const URL_RE = /https?:\/\/[^\s]+|\bwww\.[^\s]+/gi
// Loose "phone-like" run of 7+ digits (allowing spaces/dashes/plus).
const PHONE_RE = /(?:\+?\d[\d\s-]{6,}\d)/g

function countMatches(text: string, re: RegExp): number {
  const m = text.match(re)
  return m ? m.length : 0
}

function capsRatio(text: string): number {
  const letters = text.replace(/[^a-zA-Z]/g, '')
  if (letters.length === 0) return 0
  const upper = letters.replace(/[^A-Z]/g, '').length
  return upper / letters.length
}

function gradeFor(score: number): Grade {
  if (score >= 90) return 'A'
  if (score >= 75) return 'B'
  if (score >= 60) return 'C'
  if (score >= 40) return 'D'
  return 'F'
}

/**
 * Score a campaign body. Deterministic: start at 100 and deduct per issue.
 * `risk_level` reflects Meta-approval / spam risk, driven by high-severity
 * signals rather than the raw score.
 */
export function scoreCampaign(input: QualityInput): QualityResult {
  const body = (input.body ?? '').trim()
  const lower = body.toLowerCase()
  const issues: QualityIssue[] = []
  const improvements: string[] = []

  const length = body.length
  const emojiCount = countMatches(body, EMOJI_RE)
  const variableCount = countMatches(body, VARIABLE_RE)
  const urlCount = countMatches(body, URL_RE)
  const phoneCount = countMatches(body, PHONE_RE)
  const caps = capsRatio(body)
  const spamHits = SPAM_WORDS.filter((w) => lower.includes(w))

  const buttonCta = (input.buttons ?? []).some(
    (b) => (b.text ?? '').trim().length > 0 || (b.type ?? '').trim().length > 0,
  )
  const textCta = CTA_HINTS.some((h) => lower.includes(h))

  let score = 100
  const deduct = (
    n: number,
    code: string,
    severity: Severity,
    message: string,
    improvement?: string,
  ) => {
    score -= n
    issues.push({ code, severity, message })
    if (improvement) improvements.push(improvement)
  }

  // Length
  if (length === 0) {
    deduct(60, 'empty', 'high', 'The message is empty.', 'Write a message body.')
  } else if (length < MIN_LENGTH) {
    deduct(
      15,
      'too_short',
      'medium',
      `Very short (${length} chars) — may read as low-effort.`,
      'Add a little context so the message is clear on its own.',
    )
  } else if (length > MAX_LENGTH) {
    deduct(
      25,
      'over_limit',
      'high',
      `Exceeds Meta's ${MAX_LENGTH}-char body limit (${length}).`,
      'Trim the body under 1024 characters.',
    )
  } else if (length > LONG_LENGTH) {
    deduct(
      8,
      'long',
      'low',
      `On the long side (${length} chars) for WhatsApp.`,
      'Consider tightening — shorter messages tend to convert better.',
    )
  }

  // CTA
  if (!buttonCta && !textCta) {
    deduct(
      15,
      'no_cta',
      'medium',
      'No clear call to action.',
      'Tell the reader what to do next (e.g. "Reply YES", "Shop now").',
    )
  }

  // Variables / personalization
  if (variableCount === 0 && input.category === 'Marketing') {
    deduct(
      6,
      'no_personalization',
      'low',
      'No personalization variables.',
      'Use {{1}} for the name to lift engagement.',
    )
  }
  // Adjacent variables ({{1}}{{2}}) or a body that is ONLY variables get
  // rejected by Meta.
  if (/\}\}\s*\{\{/.test(body)) {
    deduct(
      12,
      'adjacent_variables',
      'high',
      'Two variables are adjacent — Meta rejects this.',
      'Put static text between variables.',
    )
  }
  if (variableCount > 0 && body.replace(VARIABLE_RE, '').trim().length < 5) {
    deduct(
      20,
      'variable_only',
      'high',
      'The body is essentially just variables — Meta will reject it.',
      'Add meaningful static text around the variables.',
    )
  }

  // Emoji
  if (emojiCount > MAX_EMOJIS) {
    deduct(
      10,
      'emoji_overload',
      'medium',
      `Too many emojis (${emojiCount}).`,
      'Keep emojis to a few for a professional tone.',
    )
  }

  // Caps
  if (caps > CAPS_RATIO_LIMIT && length >= MIN_LENGTH) {
    deduct(
      12,
      'shouting',
      'medium',
      `High proportion of capital letters (${Math.round(caps * 100)}%).`,
      'Avoid ALL-CAPS — it reads as shouting and raises spam risk.',
    )
  }

  // URLs / phones
  if (urlCount > MAX_URLS) {
    deduct(
      10,
      'url_overload',
      'medium',
      `Multiple links (${urlCount}).`,
      'Limit to one link to reduce spam signals.',
    )
  }
  if (phoneCount > MAX_PHONES) {
    deduct(
      6,
      'phone_overload',
      'low',
      `Multiple phone numbers (${phoneCount}).`,
      'Prefer a single contact method.',
    )
  }

  // Spam words
  if (spamHits.length > 0) {
    const sev: Severity = spamHits.length >= 3 ? 'high' : 'medium'
    deduct(
      Math.min(30, spamHits.length * 8),
      'spam_words',
      sev,
      `Contains promotional trigger words (${spamHits.slice(0, 5).join(', ')}).`,
      'Rephrase salesy trigger words — they raise Meta rejection / spam risk.',
    )
  }

  // Opt-out (marketing best practice)
  const hasOptOut =
    /\b(stop|unsubscribe|opt[\s-]?out)\b/i.test(body) ||
    /\b(stop|unsubscribe|opt[\s-]?out)\b/i.test(input.footer ?? '')
  if (input.category === 'Marketing' && !hasOptOut) {
    improvements.push(
      'Consider an opt-out line (e.g. "Reply STOP to unsubscribe") for marketing sends.',
    )
  }

  score = Math.max(0, Math.min(100, Math.round(score)))

  const highCount = issues.filter((i) => i.severity === 'high').length
  const mediumCount = issues.filter((i) => i.severity === 'medium').length
  const risk_level: RiskLevel =
    highCount > 0 || spamHits.length >= 3
      ? 'high'
      : mediumCount > 0 || spamHits.length > 0
        ? 'medium'
        : 'low'

  return {
    score,
    grade: gradeFor(score),
    risk_level,
    issues,
    improvements,
    metrics: {
      length,
      emoji_count: emojiCount,
      caps_ratio: Math.round(caps * 100) / 100,
      url_count: urlCount,
      phone_count: phoneCount,
      variable_count: variableCount,
      spam_word_hits: spamHits,
    },
  }
}

// ============================================================
// Plan catalog (INR-first) — the single, easy-to-edit source of truth
// for each plan's numeric limits and feature flags.
//
// `subscriptions.plan_id` (migration 040) maps into this catalog; the
// entitlement resolver reads the plan's limits here unless the account has
// an explicit override row in `entitlements`. Keeping the numbers in code
// means a pricing/limit change is a one-line edit + deploy, no migration.
//
// Prices are the PLATFORM fee only (INR/month). Meta's per-message cost is
// billed directly to the customer's own WhatsApp account — transparent,
// no markup — so it is deliberately NOT modeled here.
// ============================================================

/** Sentinel for an unbounded numeric limit. `consume_quota` treats any
 *  negative limit as "unlimited" (usage is still recorded). */
export const UNLIMITED = -1

export type PlanId = 'free' | 'starter' | 'growth' | 'agency' | 'enterprise'

/** Numeric, metered limits (checked via usage_counters / consume_quota). */
export type NumericLimitKey =
  | 'contacts_limit'
  | 'monthly_broadcasts_limit'
  | 'monthly_messages_limit'
  | 'team_members_limit'
  | 'ai_monthly_credits_limit'
  | 'automations_limit'

/** Boolean feature flags. */
export type BooleanLimitKey = 'api_access_enabled' | 'agency_workspaces_enabled'

export type LimitKey = NumericLimitKey | BooleanLimitKey

export interface PlanLimits {
  contacts_limit: number
  monthly_broadcasts_limit: number
  monthly_messages_limit: number
  team_members_limit: number
  ai_monthly_credits_limit: number
  automations_limit: number
  api_access_enabled: boolean
  agency_workspaces_enabled: boolean
}

export interface Plan {
  id: PlanId
  name: string
  /** Platform fee, INR per month. `UNLIMITED` (-1) marks custom/contact-us. */
  priceInrMonthly: number
  description: string
  limits: PlanLimits
}

// Edit these freely — they are the product's pricing knobs. Numbers are
// starting points for the India-first launch, not final.
export const PLAN_CATALOG: Record<PlanId, Plan> = {
  free: {
    id: 'free',
    name: 'Free',
    priceInrMonthly: 0,
    description: 'Try the platform — enough to run your first campaigns.',
    limits: {
      contacts_limit: 500,
      monthly_broadcasts_limit: 2,
      monthly_messages_limit: 1000,
      team_members_limit: 1,
      ai_monthly_credits_limit: 50,
      automations_limit: 1,
      api_access_enabled: false,
      agency_workspaces_enabled: false,
    },
  },
  starter: {
    id: 'starter',
    name: 'Starter',
    priceInrMonthly: 499,
    description: 'For solo sellers and small shops getting going on WhatsApp.',
    limits: {
      contacts_limit: 5_000,
      monthly_broadcasts_limit: 30,
      monthly_messages_limit: 25_000,
      team_members_limit: 3,
      ai_monthly_credits_limit: 500,
      automations_limit: 10,
      api_access_enabled: false,
      agency_workspaces_enabled: false,
    },
  },
  growth: {
    id: 'growth',
    name: 'Growth',
    priceInrMonthly: 1_499,
    description: 'For growing teams running regular campaigns and automations.',
    limits: {
      contacts_limit: 25_000,
      monthly_broadcasts_limit: 200,
      monthly_messages_limit: 150_000,
      team_members_limit: 10,
      ai_monthly_credits_limit: 3_000,
      automations_limit: 50,
      api_access_enabled: true,
      agency_workspaces_enabled: false,
    },
  },
  agency: {
    id: 'agency',
    name: 'Agency',
    priceInrMonthly: 3_999,
    description: 'For agencies managing messaging for many clients.',
    limits: {
      contacts_limit: 100_000,
      monthly_broadcasts_limit: UNLIMITED,
      monthly_messages_limit: 750_000,
      team_members_limit: 30,
      ai_monthly_credits_limit: 15_000,
      automations_limit: UNLIMITED,
      api_access_enabled: true,
      agency_workspaces_enabled: true,
    },
  },
  enterprise: {
    id: 'enterprise',
    name: 'Enterprise',
    priceInrMonthly: UNLIMITED, // custom / contact us
    description: 'Custom limits, onboarding, and support.',
    limits: {
      contacts_limit: UNLIMITED,
      monthly_broadcasts_limit: UNLIMITED,
      monthly_messages_limit: UNLIMITED,
      team_members_limit: UNLIMITED,
      ai_monthly_credits_limit: UNLIMITED,
      automations_limit: UNLIMITED,
      api_access_enabled: true,
      agency_workspaces_enabled: true,
    },
  },
}

export const PLAN_IDS = Object.keys(PLAN_CATALOG) as PlanId[]

export const DEFAULT_PLAN_ID: PlanId = 'free'

/** True when `id` is a known plan. */
export function isPlanId(id: string | null | undefined): id is PlanId {
  return !!id && id in PLAN_CATALOG
}

/** Resolve a plan by id, falling back to Free for unknown/absent ids so a
 *  stale/misconfigured `plan_id` degrades safely rather than throwing. */
export function getPlan(id: string | null | undefined): Plan {
  return isPlanId(id) ? PLAN_CATALOG[id] : PLAN_CATALOG[DEFAULT_PLAN_ID]
}

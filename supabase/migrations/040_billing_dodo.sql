-- ============================================================
-- 040_billing_dodo.sql — Billing + plan entitlements (Dodo Payments)
--
-- Adds the hosted-SaaS billing foundation. Every table is account-
-- scoped and follows the same RLS shape as `ai_configs` (029):
-- members (viewer+) may READ their account's billing state; writes are
-- admin+ or, for the machine paths (webhook, seed trigger, quota RPC),
-- the service role / SECURITY DEFINER functions that bypass RLS.
--
-- What this migration adds
--   1. `billing_customers`      — account ↔ Dodo customer mapping.
--   2. `subscriptions`          — one row per account (current plan +
--                                 status + Dodo subscription id).
--   3. `entitlements`           — OPTIONAL per-account limit overrides.
--                                 When absent, the app resolves limits
--                                 from the code plan catalog
--                                 (src/lib/billing/plans.ts) by plan_id,
--                                 so the numbers stay easy to edit.
--   4. `dodo_webhook_events`    — idempotency + audit log for inbound
--                                 Dodo webhooks (id = Dodo event id).
--   5. `usage_counters`         — per-account, per-metric, per-month
--                                 counters for quota metering.
--   6. `consume_quota(...)`     — atomic check-and-increment RPC used by
--                                 the entitlement gate.
--   7. `seed_account_billing`   — AFTER INSERT trigger on `accounts`
--                                 that seeds a free/trialing subscription
--                                 for every new account (and a backfill
--                                 for accounts that predate this file).
--                                 Deliberately a separate trigger rather
--                                 than editing the sensitive
--                                 `handle_new_user` signup path.
--
-- What this migration does NOT touch
--   - No existing WhatsApp/core tables are altered.
--   - Numeric plan limits live in code (plans.ts), not here — this file
--     only stores per-account overrides and usage.
--
-- Idempotent — safe to run multiple times. New tables use IF NOT EXISTS;
-- policies / triggers are dropped before recreate.
-- ============================================================

-- ============================================================
-- BILLING_CUSTOMERS — account ↔ Dodo customer id.
-- ============================================================
CREATE TABLE IF NOT EXISTS billing_customers (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id         uuid NOT NULL UNIQUE REFERENCES accounts(id) ON DELETE CASCADE,
  dodo_customer_id   text UNIQUE,
  email              text,
  created_at         timestamptz NOT NULL DEFAULT now(),
  updated_at         timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE billing_customers ENABLE ROW LEVEL SECURITY;

-- Members may read; all writes go through the service role (webhook /
-- checkout), which bypasses RLS — so no INSERT/UPDATE/DELETE policies.
DROP POLICY IF EXISTS billing_customers_select ON billing_customers;
CREATE POLICY billing_customers_select ON billing_customers FOR SELECT
  USING (is_account_member(account_id));

DROP TRIGGER IF EXISTS billing_customers_updated_at ON billing_customers;
CREATE TRIGGER billing_customers_updated_at
  BEFORE UPDATE ON billing_customers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- SUBSCRIPTIONS — one per account. plan_id maps into the code catalog.
-- ============================================================
CREATE TABLE IF NOT EXISTS subscriptions (
  id                     uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id             uuid NOT NULL UNIQUE REFERENCES accounts(id) ON DELETE CASCADE,
  plan_id                text NOT NULL DEFAULT 'free',
  -- Superset of Dodo subscription statuses + our local 'trialing'.
  status                 text NOT NULL DEFAULT 'trialing'
                           CHECK (status IN (
                             'trialing', 'active', 'on_hold', 'canceled',
                             'expired', 'failed', 'incomplete'
                           )),
  dodo_subscription_id   text UNIQUE,
  dodo_customer_id       text,
  current_period_start   timestamptz,
  current_period_end     timestamptz,
  cancel_at_period_end   boolean NOT NULL DEFAULT false,
  metadata               jsonb,
  created_at             timestamptz NOT NULL DEFAULT now(),
  updated_at             timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_subscriptions_account ON subscriptions(account_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_dodo_sub ON subscriptions(dodo_subscription_id);

ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- Members read; admins may update (e.g. cancel from the UI later). The
-- webhook path writes via the service role (bypasses RLS). Seeding is by
-- the SECURITY DEFINER trigger below — so no authenticated INSERT policy.
DROP POLICY IF EXISTS subscriptions_select ON subscriptions;
CREATE POLICY subscriptions_select ON subscriptions FOR SELECT
  USING (is_account_member(account_id));

DROP POLICY IF EXISTS subscriptions_update ON subscriptions;
CREATE POLICY subscriptions_update ON subscriptions FOR UPDATE
  USING (is_account_member(account_id, 'admin'));

DROP TRIGGER IF EXISTS subscriptions_updated_at ON subscriptions;
CREATE TRIGGER subscriptions_updated_at
  BEFORE UPDATE ON subscriptions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- ENTITLEMENTS — OPTIONAL per-account overrides. NULL column ⇒ fall back
-- to the plan catalog value in code. Lets us grant a custom Enterprise
-- deal without a code change.
-- ============================================================
CREATE TABLE IF NOT EXISTS entitlements (
  id                          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id                  uuid NOT NULL UNIQUE REFERENCES accounts(id) ON DELETE CASCADE,
  contacts_limit              integer,
  monthly_broadcasts_limit    integer,
  monthly_messages_limit      integer,
  team_members_limit          integer,
  ai_monthly_credits_limit    integer,
  automations_limit           integer,
  api_access_enabled          boolean,
  agency_workspaces_enabled   boolean,
  created_at                  timestamptz NOT NULL DEFAULT now(),
  updated_at                  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE entitlements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS entitlements_select ON entitlements;
CREATE POLICY entitlements_select ON entitlements FOR SELECT
  USING (is_account_member(account_id));

DROP POLICY IF EXISTS entitlements_update ON entitlements;
CREATE POLICY entitlements_update ON entitlements FOR UPDATE
  USING (is_account_member(account_id, 'admin'));

DROP TRIGGER IF EXISTS entitlements_updated_at ON entitlements;
CREATE TRIGGER entitlements_updated_at
  BEFORE UPDATE ON entitlements
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- DODO_WEBHOOK_EVENTS — idempotency + audit. id = Dodo event id, so a
-- redelivered event is a no-op (INSERT ... ON CONFLICT DO NOTHING).
--
-- RLS enabled with NO policies: internal machine data. The service role
-- (webhook) bypasses RLS; authenticated users get nothing (default deny).
-- ============================================================
CREATE TABLE IF NOT EXISTS dodo_webhook_events (
  id             text PRIMARY KEY,
  event_type     text NOT NULL,
  account_id     uuid REFERENCES accounts(id) ON DELETE SET NULL,
  status         text NOT NULL DEFAULT 'received'
                   CHECK (status IN ('received', 'processed', 'unmatched', 'error', 'ignored')),
  payload        jsonb,
  error          text,
  received_at    timestamptz NOT NULL DEFAULT now(),
  processed_at   timestamptz
);

CREATE INDEX IF NOT EXISTS idx_dodo_events_account ON dodo_webhook_events(account_id);
CREATE INDEX IF NOT EXISTS idx_dodo_events_type ON dodo_webhook_events(event_type);

ALTER TABLE dodo_webhook_events ENABLE ROW LEVEL SECURITY;
-- (No policies — service-role only.)

-- ============================================================
-- USAGE_COUNTERS — per account / metric / month.
-- ============================================================
CREATE TABLE IF NOT EXISTS usage_counters (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id     uuid NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  metric         text NOT NULL,
  period_start   date NOT NULL,
  count          integer NOT NULL DEFAULT 0,
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now(),
  UNIQUE (account_id, metric, period_start)
);

CREATE INDEX IF NOT EXISTS idx_usage_counters_lookup
  ON usage_counters(account_id, metric, period_start);

ALTER TABLE usage_counters ENABLE ROW LEVEL SECURITY;

-- Members read (so the billing UI can show usage); writes go through the
-- consume_quota RPC / service role.
DROP POLICY IF EXISTS usage_counters_select ON usage_counters;
CREATE POLICY usage_counters_select ON usage_counters FOR SELECT
  USING (is_account_member(account_id));

DROP TRIGGER IF EXISTS usage_counters_updated_at ON usage_counters;
CREATE TRIGGER usage_counters_updated_at
  BEFORE UPDATE ON usage_counters
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- consume_quota — atomic check-and-increment for the current calendar
-- month (UTC). Materialise the row first so the FOR UPDATE lock is real
-- for a brand-new (account, metric, month), then check, then increment.
-- This serialises concurrent calls on the row lock so a burst can't
-- overshoot the limit.
--
-- p_limit convention: < 0 means "unlimited" (usage is still recorded).
-- Returns (allowed, used, quota_limit). When not allowed, usage is NOT
-- incremented.
-- ============================================================
CREATE OR REPLACE FUNCTION public.consume_quota(
  p_account_id uuid,
  p_metric     text,
  p_amount     integer,
  p_limit      integer
)
RETURNS TABLE (allowed boolean, used integer, quota_limit integer)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  ps  date := date_trunc('month', now() AT TIME ZONE 'UTC')::date;
  cur integer;
BEGIN
  INSERT INTO usage_counters (account_id, metric, period_start, count)
  VALUES (p_account_id, p_metric, ps, 0)
  ON CONFLICT (account_id, metric, period_start) DO NOTHING;

  SELECT count INTO cur
  FROM usage_counters
  WHERE account_id = p_account_id AND metric = p_metric AND period_start = ps
  FOR UPDATE;

  cur := COALESCE(cur, 0);

  IF p_limit >= 0 AND cur + p_amount > p_limit THEN
    RETURN QUERY SELECT false, cur, p_limit;
    RETURN;
  END IF;

  UPDATE usage_counters
  SET count = count + p_amount, updated_at = now()
  WHERE account_id = p_account_id AND metric = p_metric AND period_start = ps;

  RETURN QUERY SELECT true, cur + p_amount, p_limit;
END;
$$;

-- The gate runs from authenticated routes (broadcast) and may later run
-- from service-role machine paths (AI metering). Grant both, mirroring
-- claim_ai_reply_slot (031). SECURITY DEFINER sets run-with privileges,
-- not who may call — the grant is still required on hardened instances.
GRANT EXECUTE ON FUNCTION public.consume_quota(uuid, text, integer, integer)
  TO authenticated, service_role;

-- ============================================================
-- seed_account_billing — every new account gets a free/trialing
-- subscription. Separate trigger (NOT an edit to handle_new_user) so the
-- signup path stays untouched; EXCEPTION-guarded so a billing hiccup can
-- never block account creation.
-- ============================================================
CREATE OR REPLACE FUNCTION public.seed_account_billing()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.subscriptions (account_id, plan_id, status)
  VALUES (NEW.id, 'free', 'trialing')
  ON CONFLICT (account_id) DO NOTHING;
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'seed_account_billing failed for account %: %', NEW.id, SQLERRM;
  RETURN NEW;
END;
$$;

ALTER FUNCTION public.seed_account_billing() OWNER TO postgres;

DROP TRIGGER IF EXISTS accounts_seed_billing ON accounts;
CREATE TRIGGER accounts_seed_billing
  AFTER INSERT ON accounts
  FOR EACH ROW EXECUTE FUNCTION public.seed_account_billing();

-- Backfill: accounts that existed before this migration get a free
-- subscription too. Idempotent.
INSERT INTO subscriptions (account_id, plan_id, status)
SELECT a.id, 'free', 'trialing'
FROM accounts a
LEFT JOIN subscriptions s ON s.account_id = a.id
WHERE s.account_id IS NULL
ON CONFLICT (account_id) DO NOTHING;

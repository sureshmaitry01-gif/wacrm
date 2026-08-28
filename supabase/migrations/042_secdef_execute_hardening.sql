-- ============================================================
-- 042_secdef_execute_hardening.sql — SECURITY DEFINER execute hardening
--
-- M07D security review. Two related issues, both fixed minimally here.
-- Migrations 040/041 are NOT edited; this is a forward-only follow-up.
--
-- ------------------------------------------------------------
-- 1. consume_quota: caller-supplied account_id / limit (MEDIUM)
-- ------------------------------------------------------------
-- `public.consume_quota(p_account_id, p_metric, p_amount, p_limit)` is
-- SECURITY DEFINER (so it bypasses RLS on `usage_counters`) and is granted
-- to `authenticated`. It took the account id AND the limit from the caller
-- without checking membership, so a signed-in user could call it directly
-- over PostgREST to:
--   - inflate ANOTHER tenant's usage counters (cross-tenant tampering), or
--   - pass an inflated p_limit to sail past their own plan cap.
--
-- The application itself was never the exposure: every caller
-- (`consumeQuota` in src/lib/billing/entitlements.ts) derives accountId
-- server-side from the session via requireRole/getCurrentAccount, and reads
-- the limit from the entitlement layer. The hole was the RPC being callable
-- directly with attacker-chosen arguments.
--
-- Fix, mirroring the `is_account_member` pattern (017) — the function now
-- authorizes itself instead of trusting its arguments:
--   * when there IS a JWT (auth.uid() IS NOT NULL) the caller must be a
--     member of p_account_id, otherwise the call is refused;
--   * when there is NO JWT the caller is the service role / a trusted
--     server path (the webhook + auto-reply engine run with no auth.uid()),
--     which is unchanged behaviour.
-- Refusal returns `allowed = false` rather than raising: `consumeQuota`
-- already treats a false result as "over quota" and every call site handles
-- it, so a blocked cross-tenant probe degrades safely instead of 500ing.
--
-- Behaviour for legitimate users is IDENTICAL — they always pass their own
-- account id.
--
-- ------------------------------------------------------------
-- 2. Default PUBLIC EXECUTE on SECURITY DEFINER functions (LOW)
-- ------------------------------------------------------------
-- Postgres grants EXECUTE to PUBLIC by default for new functions. Most
-- sensitive RPCs in this schema already REVOKE it explicitly (007, 012,
-- 018, 019, 022, 025, 028, 030, 032, 036, 037), but a few never did. A
-- GRANT is additive, so `GRANT ... TO service_role` does NOT remove the
-- implicit PUBLIC grant.
--
-- Revoke PUBLIC/anon on the ones that were missed and re-grant only the
-- roles that actually call them:
--   * consume_quota            -> authenticated (app) + service_role (engine)
--   * claim_ai_reply_slot      -> service_role only (auto-reply engine;
--                                 mirrors the 031 rationale)
--   * is_account_member        -> authenticated + service_role (RLS helper;
--                                 safe by construction — it keys off
--                                 auth.uid() — but anon has no use for it)
--   * seed_account_billing     -> trigger-only (AFTER INSERT on accounts);
--                                 no direct caller, so no grant at all
--
-- Trigger-only functions invoked by the AFTER/BEFORE triggers that own them
-- (handle_new_user, touch_presence, notify_conversation_assigned,
-- _bcast_bump, update_updated_at_column) run as the trigger owner and are
-- not meaningfully reachable through PostgREST; they are left as-is to keep
-- this migration minimal and reversible.
--
-- Idempotent — safe to run multiple times.
-- ============================================================

-- ------------------------------------------------------------
-- 1. Membership-checked consume_quota (signature unchanged).
-- ------------------------------------------------------------
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
  -- Authorize against the session rather than trusting p_account_id. A
  -- JWT-bearing caller must belong to the account; a caller with no JWT is
  -- the service role / trusted server path (webhook, engines).
  IF auth.uid() IS NOT NULL
     AND NOT is_account_member(p_account_id) THEN
    RETURN QUERY SELECT false, 0, p_limit;
    RETURN;
  END IF;

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

-- ------------------------------------------------------------
-- 2. Least-privilege EXECUTE grants.
-- ------------------------------------------------------------

-- consume_quota: app (authenticated) + engines (service_role).
REVOKE ALL ON FUNCTION public.consume_quota(uuid, text, integer, integer) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.consume_quota(uuid, text, integer, integer) FROM anon;
GRANT EXECUTE ON FUNCTION public.consume_quota(uuid, text, integer, integer)
  TO authenticated, service_role;

-- claim_ai_reply_slot: only the auto-reply engine (service role) claims
-- slots; end users must never mutate the counter directly.
REVOKE ALL ON FUNCTION public.claim_ai_reply_slot(uuid, integer) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.claim_ai_reply_slot(uuid, integer) FROM anon;
REVOKE ALL ON FUNCTION public.claim_ai_reply_slot(uuid, integer) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.claim_ai_reply_slot(uuid, integer) TO service_role;

-- is_account_member: the RLS helper. Safe by construction (it resolves
-- auth.uid() itself), but anon has no legitimate use for it.
REVOKE ALL ON FUNCTION public.is_account_member(uuid, account_role_enum) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.is_account_member(uuid, account_role_enum) FROM anon;
GRANT EXECUTE ON FUNCTION public.is_account_member(uuid, account_role_enum)
  TO authenticated, service_role;

-- seed_account_billing: trigger-only (accounts AFTER INSERT). Nothing
-- should call it directly.
REVOKE ALL ON FUNCTION public.seed_account_billing() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.seed_account_billing() FROM anon;
REVOKE ALL ON FUNCTION public.seed_account_billing() FROM authenticated;

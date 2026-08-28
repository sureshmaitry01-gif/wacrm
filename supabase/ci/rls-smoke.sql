-- Cross-tenant RLS smoke test for the CI job in
-- `.github/workflows/migrations.yml` (added in M07B).
--
-- verify-schema.sql proves the billing objects EXIST and have RLS enabled.
-- This proves the RLS policies actually ISOLATE tenants: seed two accounts
-- via the real signup trigger path, then, acting as authenticated Tenant B,
-- assert B can read NONE of Tenant A's billing rows and exactly its own.
--
-- Constraints (same as verify-schema.sql — read that file's footer):
--   * EXACTLY ONE statement. `supabase db query --file` sends the whole
--     file as one prepared statement, so everything lives in ONE DO block.
--   * A RAISE EXCEPTION in here fails the CI job — that is the point.
--
-- Seed rows are removed at the end (auth.users delete cascades), so this is
-- safe to run against a non-ephemeral local database too.
DO $$
DECLARE
  uida uuid; uidb uuid; accta uuid; acctb uuid;
  suba int; subb int;
  leak_sub int; leak_usage int; leak_dodo int; own_sub int;
  quota_allowed boolean; a_count int; own_allowed boolean;
BEGIN
  -- Seed two accounts through the real path: inserting into auth.users
  -- fires handle_new_user (profile + account + owner membership, 017) and
  -- accounts_seed_billing (free subscription, 040). Runs as the migration
  -- role so the triggers have full privileges.
  INSERT INTO auth.users (id, instance_id, aud, role, email, raw_user_meta_data, created_at, updated_at)
  VALUES (gen_random_uuid(), '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
          'a@rls-smoke.ci', '{"full_name":"CI Tenant A"}', now(), now())
  RETURNING id INTO uida;
  INSERT INTO auth.users (id, instance_id, aud, role, email, raw_user_meta_data, created_at, updated_at)
  VALUES (gen_random_uuid(), '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
          'b@rls-smoke.ci', '{"full_name":"CI Tenant B"}', now(), now())
  RETURNING id INTO uidb;

  SELECT account_id INTO accta FROM profiles WHERE user_id = uida;
  SELECT account_id INTO acctb FROM profiles WHERE user_id = uidb;
  IF accta IS NULL OR acctb IS NULL OR accta = acctb THEN
    RAISE EXCEPTION 'signup trigger did not provision two distinct accounts (A=%, B=%)', accta, acctb;
  END IF;

  -- Each new account must have been auto-seeded exactly one subscription.
  SELECT count(*) INTO suba FROM subscriptions WHERE account_id = accta;
  SELECT count(*) INTO subb FROM subscriptions WHERE account_id = acctb;
  IF suba <> 1 OR subb <> 1 THEN
    RAISE EXCEPTION 'accounts_seed_billing seeded the wrong count (A=%, B=%)', suba, subb;
  END IF;

  -- Put sensitive rows on account A to try to leak to B.
  INSERT INTO usage_counters (account_id, metric, period_start, count)
  VALUES (accta, 'monthly_messages_limit', date_trunc('month', now())::date, 42);
  INSERT INTO dodo_webhook_events (id, event_type, account_id, payload)
  VALUES ('evt_rls_smoke_ci', 'subscription.active', accta, '{"secret":true}');

  -- ===== Act as authenticated Tenant B =====
  PERFORM set_config('request.jwt.claim.sub', uidb::text, true);
  SET LOCAL ROLE authenticated;

  SELECT count(*) INTO leak_sub   FROM subscriptions      WHERE account_id = accta;
  SELECT count(*) INTO leak_usage FROM usage_counters     WHERE account_id = accta;
  SELECT count(*) INTO leak_dodo  FROM dodo_webhook_events;  -- service-role-only: 0 for any member
  SELECT count(*) INTO own_sub    FROM subscriptions;         -- B sees only its own

  -- Regression (migration 042): consume_quota is SECURITY DEFINER, so it
  -- bypasses RLS on usage_counters. Tenant B calling it against Tenant A's
  -- account must be REFUSED (allowed=false) and must not mutate A's counter.
  SELECT allowed INTO quota_allowed
  FROM consume_quota(accta, 'monthly_messages_limit', 5, 1000000);

  -- ...and B metering its OWN account must still work.
  SELECT allowed INTO own_allowed
  FROM consume_quota(acctb, 'monthly_messages_limit', 1, 1000000);

  RESET ROLE;

  IF quota_allowed IS DISTINCT FROM false THEN
    RAISE EXCEPTION 'CROSS-TENANT QUOTA ABUSE: Tenant B consumed quota against Tenant A (allowed=%)', quota_allowed;
  END IF;
  -- A's counter must be untouched (seeded at 42 above).
  SELECT count INTO a_count FROM usage_counters
  WHERE account_id = accta AND metric = 'monthly_messages_limit'
    AND period_start = date_trunc('month', now())::date;
  IF a_count <> 42 THEN
    RAISE EXCEPTION 'CROSS-TENANT QUOTA TAMPERING: Tenant A counter changed 42 -> %', a_count;
  END IF;
  IF own_allowed IS DISTINCT FROM true THEN
    RAISE EXCEPTION 'consume_quota too strict: Tenant B cannot meter its own account (allowed=%)', own_allowed;
  END IF;

  IF leak_sub <> 0 OR leak_usage <> 0 OR leak_dodo <> 0 THEN
    RAISE EXCEPTION 'CROSS-TENANT LEAK: Tenant B read Tenant A rows (subscriptions=%, usage_counters=%, dodo_webhook_events=%)',
      leak_sub, leak_usage, leak_dodo;
  END IF;
  IF own_sub <> 1 THEN
    RAISE EXCEPTION 'RLS too strict: Tenant B cannot read its own subscription (own_sub=%)', own_sub;
  END IF;

  -- Clean up. Order matters: accounts.owner_user_id -> auth.users is
  -- ON DELETE RESTRICT, so the accounts must go first. Deleting the
  -- accounts cascades profiles (profiles.account_id ON DELETE CASCADE) and
  -- every account-scoped billing row; the users can then be removed.
  DELETE FROM accounts WHERE id IN (accta, acctb);
  DELETE FROM auth.users WHERE id IN (uida, uidb);
  -- dodo_webhook_events.account_id is ON DELETE SET NULL (the audit log
  -- deliberately survives account deletion), so the cascade above leaves
  -- this row orphaned — remove it explicitly so re-runs stay idempotent.
  DELETE FROM dodo_webhook_events WHERE id = 'evt_rls_smoke_ci';

  RAISE NOTICE 'cross-tenant RLS smoke test passed';
END
$$;

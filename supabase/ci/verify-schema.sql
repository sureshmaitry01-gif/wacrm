-- Post-migration assertions for the CI job in
-- `.github/workflows/migrations.yml`.
--
-- `supabase db reset` already fails on any statement Postgres rejects,
-- so this is not about syntax. It's about the quieter failure: a
-- migration that applies cleanly and does nothing. Every DDL statement
-- in this repo is guarded with IF NOT EXISTS / ON CONFLICT so the files
-- can be re-run safely, and that same guard turns a typo'd object name
-- into a silent no-op with a green checkmark.
--
-- Keep this thin. It is a smoke test for "did the migrations actually
-- build the schema", not a spec of it — asserting every column here
-- would just be the migrations restated in a second place, drifting.
DO $$
DECLARE
  t text;
BEGIN
  -- The core tables, from 001.
  IF to_regclass('public.messages') IS NULL THEN
    RAISE EXCEPTION 'public.messages is missing — migrations did not apply';
  END IF;
  IF to_regclass('public.whatsapp_config') IS NULL THEN
    RAISE EXCEPTION 'public.whatsapp_config is missing — migrations did not apply';
  END IF;

  -- Supabase provides the storage schema; migrations 016/020/023 write
  -- to it. If it is absent the bucket migrations silently accomplish
  -- nothing, which is precisely the case a plain "no errors" run hides.
  IF to_regclass('storage.buckets') IS NULL THEN
    RAISE EXCEPTION
      'storage.buckets is missing — the storage schema was not available when the bucket migrations ran';
  END IF;

  -- Buckets are UPSERTed, so their absence means the INSERT never ran.
  IF NOT EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'chat-media') THEN
    RAISE EXCEPTION 'the chat-media bucket row was not created (migration 023)';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'flow-media') THEN
    RAISE EXCEPTION 'the flow-media bucket row was not created (migration 016)';
  END IF;

  -- Account scoping (017) is load-bearing for every RLS policy.
  IF to_regclass('public.accounts') IS NULL THEN
    RAISE EXCEPTION 'public.accounts is missing — migration 017 did not apply';
  END IF;

  -- Billing foundation (040). subscriptions is the load-bearing table:
  -- the accounts seed trigger writes it and every entitlement read
  -- resolves through it.
  IF to_regclass('public.subscriptions') IS NULL THEN
    RAISE EXCEPTION 'public.subscriptions is missing — migration 040 did not apply';
  END IF;
  IF to_regclass('public.usage_counters') IS NULL THEN
    RAISE EXCEPTION 'public.usage_counters is missing — migration 040 did not apply';
  END IF;

  -- RLS must be ENABLED on every billing table. A billing table without
  -- RLS is a cross-tenant data leak, and IF-guarded migrations can silently
  -- create a table while skipping its ALTER ... ENABLE ROW LEVEL SECURITY.
  FOREACH t IN ARRAY ARRAY[
    'billing_customers','subscriptions','entitlements',
    'dodo_webhook_events','usage_counters'
  ] LOOP
    IF NOT COALESCE(
      (SELECT relrowsecurity FROM pg_class WHERE oid = ('public.'||t)::regclass),
      false
    ) THEN
      RAISE EXCEPTION 'RLS is not enabled on public.% (migration 040)', t;
    END IF;
  END LOOP;

  -- The quota gate + the account seed path (040) are load-bearing.
  IF to_regprocedure('public.consume_quota(uuid,text,integer,integer)') IS NULL THEN
    RAISE EXCEPTION 'consume_quota(uuid,text,integer,integer) is missing (migration 040)';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'accounts_seed_billing') THEN
    RAISE EXCEPTION 'accounts_seed_billing trigger is missing (migration 040)';
  END IF;

  -- 041 relaxed the ai_usage_log provider CHECK to admit platform DeepSeek.
  -- If the ALTER silently no-op'd, deepseek usage logging would fail the
  -- constraint at runtime.
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.ai_usage_log'::regclass AND contype = 'c'
      AND pg_get_constraintdef(oid) LIKE '%deepseek%'
  ) THEN
    RAISE EXCEPTION 'ai_usage_log provider CHECK does not allow deepseek (migration 041)';
  END IF;

  -- ----------------------------------------------------------
  -- 042: SECURITY DEFINER execute hardening.
  --
  -- These assert least-privilege EXECUTE, which a GRANT alone does NOT
  -- give you: Postgres grants EXECUTE to PUBLIC by default, and a later
  -- GRANT is additive. If the REVOKEs in 042 silently no-op'd, these
  -- RPCs would stay callable by anon/PUBLIC over PostgREST.
  -- ----------------------------------------------------------

  -- anon must NOT be able to execute the quota meter (it bypasses RLS on
  -- usage_counters), the AI slot claimer, or the membership helper.
  IF has_function_privilege('anon',
       'public.consume_quota(uuid, text, integer, integer)', 'EXECUTE') THEN
    RAISE EXCEPTION 'anon can EXECUTE consume_quota (migration 042 REVOKE did not apply)';
  END IF;
  IF has_function_privilege('anon',
       'public.claim_ai_reply_slot(uuid, integer)', 'EXECUTE') THEN
    RAISE EXCEPTION 'anon can EXECUTE claim_ai_reply_slot (migration 042 REVOKE did not apply)';
  END IF;
  IF has_function_privilege('anon',
       'public.is_account_member(uuid, account_role_enum)', 'EXECUTE') THEN
    RAISE EXCEPTION 'anon can EXECUTE is_account_member (migration 042 REVOKE did not apply)';
  END IF;

  -- End users must never mutate the AI reply counter directly.
  IF has_function_privilege('authenticated',
       'public.claim_ai_reply_slot(uuid, integer)', 'EXECUTE') THEN
    RAISE EXCEPTION 'authenticated can EXECUTE claim_ai_reply_slot (should be service_role only)';
  END IF;

  -- seed_account_billing is trigger-only: no direct caller at all.
  IF has_function_privilege('authenticated',
       'public.seed_account_billing()', 'EXECUTE')
     OR has_function_privilege('anon', 'public.seed_account_billing()', 'EXECUTE') THEN
    RAISE EXCEPTION 'seed_account_billing is directly executable (should be trigger-only)';
  END IF;

  -- ...but the legitimate paths must KEEP working.
  IF NOT has_function_privilege('authenticated',
       'public.consume_quota(uuid, text, integer, integer)', 'EXECUTE') THEN
    RAISE EXCEPTION 'authenticated lost EXECUTE on consume_quota (app quota path broken)';
  END IF;
  IF NOT has_function_privilege('service_role',
       'public.consume_quota(uuid, text, integer, integer)', 'EXECUTE') THEN
    RAISE EXCEPTION 'service_role lost EXECUTE on consume_quota (engine quota path broken)';
  END IF;
  IF NOT has_function_privilege('service_role',
       'public.claim_ai_reply_slot(uuid, integer)', 'EXECUTE') THEN
    RAISE EXCEPTION 'service_role lost EXECUTE on claim_ai_reply_slot (auto-reply broken)';
  END IF;
  IF NOT has_function_privilege('authenticated',
       'public.is_account_member(uuid, account_role_enum)', 'EXECUTE') THEN
    RAISE EXCEPTION 'authenticated lost EXECUTE on is_account_member (every RLS policy breaks)';
  END IF;

  RAISE NOTICE 'schema verification passed';
END
$$;

-- Two things this file has already been burned by, both verified in CI
-- rather than assumed:
--
-- 1. It must contain EXACTLY ONE statement. `supabase db query --file`
--    sends the whole file as a prepared statement, and a second
--    top-level statement fails with the distinctly unhelpful "cannot
--    insert multiple commands into a prepared statement" (commit
--    f91a6c8). Add assertions INSIDE the DO block above; do not append
--    a second one.
--
-- 2. A RAISE in here really does fail the job. A deliberately false
--    assertion (commit 42c7db0, run 31579334056) surfaced as
--    `failed to execute query: error: ...` and exited 1. This is not a
--    decorative green tick.

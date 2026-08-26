-- ============================================================
-- 041_ai_usage_deepseek_provider.sql — allow 'deepseek' in ai_usage_log
--
-- M03 introduces platform-provided AI on DeepSeek. `ai_usage_log`
-- (migration 033) carries a CHECK constraining `provider` to
-- ('openai','anthropic'); logging a DeepSeek call would violate it and the
-- best-effort usage insert would silently fail. Relax the CHECK to include
-- 'deepseek'.
--
-- This is the ONLY schema change M03 needs. Credit metering itself reuses
-- the M02 `usage_counters` / `consume_quota` machinery — no new table.
--
-- Idempotent: drop the (auto-named) constraint if present, then re-add.
-- ============================================================
ALTER TABLE ai_usage_log DROP CONSTRAINT IF EXISTS ai_usage_log_provider_check;

ALTER TABLE ai_usage_log
  ADD CONSTRAINT ai_usage_log_provider_check
  CHECK (provider IN ('openai', 'anthropic', 'deepseek'));

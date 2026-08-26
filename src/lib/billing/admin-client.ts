import { createClient, type SupabaseClient } from '@supabase/supabase-js'

// Lazy, shared service-role client for the billing paths.
// Mirrors src/lib/ai/admin-client.ts — the Dodo webhook has no
// `auth.uid()`, so it reads/writes subscription state through the service
// role (which bypasses RLS; `dodo_webhook_events` has no policies at all).
let _adminClient: SupabaseClient | null = null

export function supabaseAdmin(): SupabaseClient {
  if (!_adminClient) {
    _adminClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    )
  }
  return _adminClient
}

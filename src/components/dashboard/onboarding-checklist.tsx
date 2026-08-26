'use client';

// ============================================================
// OnboardingChecklist (M06) — India-first first-run guidance.
//
// Shows a new account the path from signup to first campaign. Every step's
// completion is derived from EXISTING account-scoped rows (no new table);
// the card auto-hides once all steps are complete, and a per-account
// "dismiss" is remembered in localStorage (device-scoped, like the theme /
// contact-panel prefs) — no schema change.
//
// Copy is English + hardcoded (the app has no per-user language switcher;
// see docs/onboarding). The India-first value is the Hinglish AI writing it
// points to, plus the plain-English INR / no-markup framing.
// ============================================================

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, CheckCircle2, Sparkles, X } from 'lucide-react';

import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/hooks/use-auth';
import { cn } from '@/lib/utils';
import {
  buildOnboardingSteps,
  firstIncompleteStep,
  onboardingProgress,
  type OnboardingInput,
} from '@/lib/onboarding/steps';

const dismissKey = (accountId: string) => `wacrm:onboarding:dismissed:${accountId}`;

export function OnboardingChecklist() {
  const { accountId } = useAuth();
  const [input, setInput] = useState<OnboardingInput | null>(null);
  const [dismissed, setDismissed] = useState(false);

  // Restore per-account dismissal after mount (avoids a hydration mismatch).
  useEffect(() => {
    if (!accountId) return;
    try {
      // Restoring a persisted preference from an external store is a
      // legitimate effect-sync (mirrors settings-overview / the inbox
      // contact-panel restore).
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setDismissed(localStorage.getItem(dismissKey(accountId)) === 'true');
    } catch {
      // localStorage can throw in private/sandboxed contexts — show the card.
    }
  }, [accountId]);

  // Derive step state from real rows (RLS scopes each to this account).
  useEffect(() => {
    if (!accountId) return;
    let cancelled = false;
    const db = createClient();
    void (async () => {
      const [wa, contacts, templates, broadcasts] = await Promise.all([
        db
          .from('whatsapp_config')
          .select('phone_number_id')
          .eq('account_id', accountId)
          .maybeSingle(),
        db.from('contacts').select('id', { count: 'exact', head: true }),
        db.from('message_templates').select('id', { count: 'exact', head: true }),
        db.from('broadcasts').select('id', { count: 'exact', head: true }),
      ]);
      if (cancelled) return;
      setInput({
        whatsappConfigured: !!wa.data?.phone_number_id,
        contactsExist: (contacts.count ?? 0) > 0,
        templatesExist: (templates.count ?? 0) > 0,
        broadcastsExist: (broadcasts.count ?? 0) > 0,
      });
    })();
    return () => {
      cancelled = true;
    };
  }, [accountId]);

  const dismiss = useCallback(() => {
    setDismissed(true);
    try {
      if (accountId) localStorage.setItem(dismissKey(accountId), 'true');
    } catch {
      // Best-effort; the card just reappears next load if storage failed.
    }
  }, [accountId]);

  // Nothing until we know the state; hidden once dismissed.
  if (!input || dismissed) return null;

  const steps = buildOnboardingSteps(input);
  const progress = onboardingProgress(steps);
  // Fully set up — the card has served its purpose.
  if (progress.complete) return null;

  const next = firstIncompleteStep(steps);

  return (
    <section className="rounded-xl border border-border bg-card p-5 shadow-card">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Sparkles className="h-4 w-4" />
          </span>
          <div>
            <h2 className="text-base font-semibold tracking-tight text-foreground">
              Get started
            </h2>
            <p className="text-sm text-muted-foreground">
              A few steps to send your first WhatsApp campaign.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={dismiss}
          aria-label="Dismiss getting started"
          className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Progress */}
      <div className="mt-4 flex items-center gap-3">
        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-primary transition-all"
            style={{ width: `${progress.percent}%` }}
          />
        </div>
        <span className="shrink-0 text-xs font-medium tabular-nums text-muted-foreground">
          {progress.done} of {progress.total}
        </span>
      </div>

      {/* Steps */}
      <ol className="mt-4 space-y-2">
        {steps.map((step) => {
          const isNext = next?.id === step.id;
          return (
            <li
              key={step.id}
              className={cn(
                'flex items-start gap-3 rounded-lg border p-3 transition-colors',
                step.complete
                  ? 'border-transparent bg-muted/40'
                  : isNext
                    ? 'border-primary/25 bg-primary/5'
                    : 'border-border bg-card',
              )}
            >
              <span className="mt-0.5 shrink-0">
                {step.complete ? (
                  <CheckCircle2 className="h-5 w-5 text-primary" />
                ) : (
                  <span
                    className={cn(
                      'flex h-5 w-5 items-center justify-center rounded-full border-2',
                      isNext ? 'border-primary' : 'border-muted-foreground/40',
                    )}
                  />
                )}
              </span>
              <div className="min-w-0 flex-1">
                <p
                  className={cn(
                    'text-sm font-medium',
                    step.complete
                      ? 'text-muted-foreground line-through'
                      : 'text-foreground',
                  )}
                >
                  {step.title}
                </p>
                {!step.complete && (
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {step.description}
                  </p>
                )}
              </div>
              {!step.complete && (
                <Link
                  href={step.href}
                  className={cn(
                    'inline-flex shrink-0 items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors',
                    isNext
                      ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                      : 'text-primary hover:bg-primary/10',
                  )}
                >
                  {step.cta}
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              )}
            </li>
          );
        })}
      </ol>

      {/* India-first footer — plain-English cost framing, no jargon. */}
      <p className="mt-4 text-[11px] leading-relaxed text-muted-foreground">
        You pay Meta&apos;s per-message rate directly in ₹ — we never add a
        markup. Marketing templates are reviewed by WhatsApp before they can be
        sent.
      </p>
    </section>
  );
}

'use client';

// ============================================================
// PaymentStatusNotice (M07C) — presentation-only dunning banner.
//
// Self-fetches the EXISTING billing status and, only for an actionable
// problem state (failed / on_hold / expired), shows a calm banner pointing
// the customer to Settings → Billing. It mutates no billing state, disables
// no functionality, and renders nothing for healthy accounts (the vast
// majority) or if the status can't be loaded.
// ============================================================

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { AlertTriangle, ArrowRight } from 'lucide-react';

import { useAuth } from '@/hooks/use-auth';
import { cn } from '@/lib/utils';
import { paymentNotice, type PaymentNotice } from '@/lib/billing/payment-status';

const TONE: Record<
  PaymentNotice['tone'],
  { wrap: string; icon: string; cta: string }
> = {
  warning: {
    wrap: 'border-amber-500/30 bg-amber-500/10',
    icon: 'text-amber-600 dark:text-amber-400',
    cta: 'Update payment',
  },
  critical: {
    wrap: 'border-red-500/30 bg-red-500/10',
    icon: 'text-red-600 dark:text-red-400',
    cta: 'Renew plan',
  },
};

export function PaymentStatusNotice() {
  const { accountId } = useAuth();
  const [notice, setNotice] = useState<PaymentNotice | null>(null);

  useEffect(() => {
    if (!accountId) return;
    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch('/api/billing/status');
        if (!res.ok) return;
        const data = (await res.json()) as { status?: string };
        if (cancelled || typeof data.status !== 'string') return;
        setNotice(paymentNotice(data.status));
      } catch {
        // Best-effort — never block or alarm on a failed status read.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [accountId]);

  if (!notice) return null;
  const tone = TONE[notice.tone];

  return (
    <div className={cn('rounded-xl border p-4 shadow-card', tone.wrap)}>
      <div className="flex items-start gap-3">
        <AlertTriangle className={cn('mt-0.5 h-5 w-5 shrink-0', tone.icon)} />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-foreground">{notice.title}</p>
          <p className="mt-0.5 text-sm text-muted-foreground">{notice.body}</p>
        </div>
        <Link
          href="/settings?tab=billing"
          className="inline-flex shrink-0 items-center gap-1 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          {tone.cta}
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </div>
  );
}

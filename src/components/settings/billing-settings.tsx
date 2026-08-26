'use client';

// ============================================================
// BillingSettings — Settings → Plan & billing
//
// Shows the account's current plan, subscription status, this month's usage
// against the plan limits (with usage bars), and upgrade options. Checkout
// redirects to the provider's hosted page (admin+ only).
//
// M05E gave this its premium visual pass. The data flow, /api/billing/*
// calls, entitlement/quota logic, and Dodo internals are UNCHANGED — this
// file is presentation only.
// ============================================================

import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { CreditCard, Loader2, ShieldCheck } from 'lucide-react';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { RequireRole } from '@/components/auth/require-role';
import { SettingsPanelHead } from './settings-panel-head';

interface CatalogEntry {
  id: string;
  name: string;
  price_inr_monthly: number;
  description: string;
}

interface BillingStatus {
  plan: string;
  plan_name: string;
  status: string;
  active: boolean;
  limits: Record<string, number | boolean>;
  usage: Record<string, number>;
  current_period_end: string | null;
  checkout_available: boolean;
  catalog: CatalogEntry[];
}

/** Metrics surfaced in the usage list, with human labels. */
const USAGE_ROWS: { metric: string; label: string }[] = [
  { metric: 'monthly_messages_limit', label: 'Messages this month' },
  { metric: 'monthly_broadcasts_limit', label: 'Campaigns this month' },
  { metric: 'ai_monthly_credits_limit', label: 'AI credits this month' },
];

const PROBLEM_STATUSES = new Set([
  'on_hold',
  'failed',
  'expired',
  'canceled',
  'cancelled',
]);

function fmtLimit(value: number | boolean | undefined): string {
  if (typeof value === 'boolean') return value ? 'Included' : 'Not included';
  if (value === undefined) return '—';
  if (value < 0) return 'Unlimited';
  return value.toLocaleString('en-IN');
}

function fmtPrice(inrMonthly: number): string {
  if (inrMonthly < 0) return 'Custom';
  if (inrMonthly === 0) return 'Free';
  return `₹${inrMonthly.toLocaleString('en-IN')}/mo`;
}

/** Soft status pill — emerald for healthy, red for problem states. */
function StatusPill({ status, active }: { status: string; active: boolean }) {
  const problem = PROBLEM_STATUSES.has(status);
  const tone = problem
    ? 'bg-red-500/10 text-red-600 dark:text-red-400'
    : active
      ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
      : 'bg-muted text-muted-foreground';
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium capitalize',
        tone,
      )}
    >
      {status.replace(/_/g, ' ')}
    </span>
  );
}

/** Used-vs-limit bar; turns amber then red as the account nears its cap. */
function UsageBar({
  used,
  limit,
}: {
  used: number;
  limit: number | boolean | undefined;
}) {
  const unlimited = typeof limit !== 'number' || limit < 0;
  const pct = unlimited
    ? 0
    : limit === 0
      ? 100
      : Math.min(100, Math.round((used / limit) * 100));
  const tone =
    pct >= 90 ? 'bg-red-500' : pct >= 75 ? 'bg-amber-500' : 'bg-primary';
  return (
    <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-muted">
      {!unlimited && (
        <div
          className={cn('h-full rounded-full transition-all', tone)}
          style={{ width: `${Math.max(pct, used > 0 ? 4 : 0)}%` }}
        />
      )}
    </div>
  );
}

export function BillingSettings() {
  const [data, setData] = useState<BillingStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [busyPlan, setBusyPlan] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/billing/status');
      if (!res.ok) throw new Error('Failed to load billing status');
      setData((await res.json()) as BillingStatus);
    } catch {
      toast.error('Could not load your plan details.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const upgrade = async (planId: string) => {
    setBusyPlan(planId);
    try {
      const res = await fetch('/api/billing/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan_id: planId }),
      });
      const body = (await res.json()) as { url?: string; error?: string };
      if (!res.ok || !body.url) {
        toast.error(body.error ?? 'Could not start checkout.');
        return;
      }
      window.location.href = body.url;
    } catch {
      toast.error('Could not start checkout.');
    } finally {
      setBusyPlan(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading plan…
      </div>
    );
  }

  if (!data) return null;

  const currentPrice = data.catalog.find((p) => p.id === data.plan)?.price_inr_monthly;

  return (
    <div>
      <SettingsPanelHead
        title="Plan & billing"
        description="Your current plan, this month's usage, and upgrade options. WhatsApp message charges are billed directly by Meta to your own WhatsApp account — we never add a markup."
      />

      {/* Current plan — hero card */}
      <div className="mb-4 rounded-xl border border-border bg-card p-5 shadow-card">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <CreditCard className="h-5 w-5" />
            </span>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-lg font-semibold tracking-tight text-foreground">
                  {data.plan_name}
                </span>
                <StatusPill status={data.status} active={data.active} />
              </div>
              {!data.active ? (
                <p className="mt-1 text-sm text-muted-foreground">
                  Your subscription is not active — free-plan limits apply until
                  it is renewed.
                </p>
              ) : data.current_period_end ? (
                <p className="mt-1 text-sm text-muted-foreground">
                  Renews on{' '}
                  {new Date(data.current_period_end).toLocaleDateString()}
                </p>
              ) : null}
            </div>
          </div>
          {currentPrice !== undefined ? (
            <div className="text-right">
              <p className="text-2xl font-bold tracking-tight text-foreground">
                {fmtPrice(currentPrice)}
              </p>
              <p className="text-[11px] text-muted-foreground">platform fee</p>
            </div>
          ) : null}
        </div>
      </div>

      {/* Usage */}
      <div className="mb-4 rounded-xl border border-border bg-card p-5 shadow-card">
        <h3 className="mb-4 text-sm font-semibold text-foreground">
          Usage this month
        </h3>
        <div className="space-y-4">
          {USAGE_ROWS.map((row) => {
            const used = data.usage[row.metric] ?? 0;
            const limit = data.limits[row.metric];
            return (
              <div key={row.metric}>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{row.label}</span>
                  <span className="font-medium tabular-nums text-foreground">
                    {used.toLocaleString('en-IN')}
                    <span className="text-muted-foreground">
                      {' / '}
                      {fmtLimit(limit)}
                    </span>
                  </span>
                </div>
                <UsageBar used={used} limit={limit} />
              </div>
            );
          })}
        </div>
      </div>

      {/* Plans */}
      <RequireRole min="admin">
        <div className="rounded-xl border border-border bg-card p-5 shadow-card">
          <h3 className="mb-1 text-sm font-semibold text-foreground">
            Available plans
          </h3>
          {!data.checkout_available ? (
            <p className="mb-3 text-xs text-muted-foreground">
              Checkout is not configured on this deployment yet.
            </p>
          ) : null}
          <div className="mt-3 space-y-2.5">
            {data.catalog.map((plan) => {
              const current = plan.id === data.plan;
              const purchasable =
                plan.id !== 'free' &&
                plan.id !== 'enterprise' &&
                data.checkout_available;
              return (
                <div
                  key={plan.id}
                  className={cn(
                    'flex flex-wrap items-center justify-between gap-3 rounded-lg border p-3.5 transition-colors',
                    current
                      ? 'border-primary/30 bg-primary/5'
                      : 'border-border bg-card',
                  )}
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-foreground">
                        {plan.name}
                      </span>
                      {current ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
                          <ShieldCheck className="h-3 w-3" />
                          Current
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-0.5 text-sm text-muted-foreground">
                      {plan.description}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-semibold text-foreground">
                      {fmtPrice(plan.price_inr_monthly)}
                    </span>
                    {purchasable && !current ? (
                      <Button
                        size="sm"
                        disabled={busyPlan !== null}
                        onClick={() => void upgrade(plan.id)}
                      >
                        {busyPlan === plan.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          'Upgrade'
                        )}
                      </Button>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </RequireRole>
    </div>
  );
}

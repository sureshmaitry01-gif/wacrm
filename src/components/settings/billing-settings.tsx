'use client';

// ============================================================
// BillingSettings — Settings → Plan & billing
//
// Minimal M02 foundation: shows the account's current plan, subscription
// status, and this month's usage against the plan limits, plus upgrade
// CTAs. Checkout redirects to the provider's hosted page (admin+ only).
//
// Deliberately unpolished — M05 (premium UI redesign) owns the visual
// pass. This exists so the billing state is inspectable and the upgrade
// path is wired end to end.
// ============================================================

import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { CreditCard, Loader2 } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
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

function fmtLimit(value: number | boolean | undefined): string {
  if (typeof value === 'boolean') return value ? 'Included' : 'Not included';
  if (value === undefined) return '—';
  if (value < 0) return 'Unlimited';
  return value.toLocaleString('en-IN');
}

function statusTone(status: string): 'default' | 'secondary' | 'destructive' {
  if (status === 'active' || status === 'trialing') return 'default';
  if (status === 'on_hold' || status === 'failed') return 'destructive';
  return 'secondary';
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

  return (
    <div>
      <SettingsPanelHead
        title="Plan & billing"
        description="Your current plan, this month's usage, and upgrade options. WhatsApp message charges are billed directly by Meta to your own WhatsApp account — we never add a markup."
      />

      {/* Current plan */}
      <Card className="mb-5">
        <CardContent className="flex flex-wrap items-center justify-between gap-4 pt-6">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-muted-foreground" />
              <span className="text-base font-semibold text-foreground">
                {data.plan_name}
              </span>
              <Badge variant={statusTone(data.status)}>{data.status}</Badge>
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
        </CardContent>
      </Card>

      {/* Usage */}
      <Card className="mb-5">
        <CardContent className="pt-6">
          <h3 className="mb-3 text-sm font-semibold text-foreground">
            Usage this month
          </h3>
          <dl className="space-y-2">
            {USAGE_ROWS.map((row) => (
              <div
                key={row.metric}
                className="flex items-center justify-between text-sm"
              >
                <dt className="text-muted-foreground">{row.label}</dt>
                <dd className="font-medium text-foreground">
                  {(data.usage[row.metric] ?? 0).toLocaleString('en-IN')}
                  {' / '}
                  {fmtLimit(data.limits[row.metric])}
                </dd>
              </div>
            ))}
          </dl>
        </CardContent>
      </Card>

      {/* Plans */}
      <RequireRole min="admin">
        <Card>
          <CardContent className="pt-6">
            <h3 className="mb-3 text-sm font-semibold text-foreground">
              Available plans
            </h3>
            {!data.checkout_available ? (
              <p className="mb-3 text-sm text-muted-foreground">
                Checkout is not configured on this deployment yet.
              </p>
            ) : null}
            <div className="space-y-3">
              {data.catalog.map((plan) => {
                const current = plan.id === data.plan;
                const purchasable =
                  plan.id !== 'free' &&
                  plan.id !== 'enterprise' &&
                  data.checkout_available;
                return (
                  <div
                    key={plan.id}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border p-3"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-foreground">
                          {plan.name}
                        </span>
                        {current ? (
                          <Badge variant="secondary">Current</Badge>
                        ) : null}
                      </div>
                      <p className="mt-0.5 text-sm text-muted-foreground">
                        {plan.description}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium text-foreground">
                        {plan.price_inr_monthly < 0
                          ? 'Custom'
                          : plan.price_inr_monthly === 0
                            ? 'Free'
                            : `₹${plan.price_inr_monthly.toLocaleString('en-IN')}/mo`}
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
          </CardContent>
        </Card>
      </RequireRole>
    </div>
  );
}

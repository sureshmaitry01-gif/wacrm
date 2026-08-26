'use client';

// ============================================================
// CampaignInsights — read-only cost + quality card for the broadcast
// review step (M04).
//
// Self-contained and side-effect-free: it POSTs the already-in-scope
// template + recipient count to the deterministic /api/campaigns/estimate
// and /api/campaigns/quality endpoints and renders the results. It never
// sends, never mutates wizard state. The premium visual pass is M05 — this
// is intentionally minimal, matching existing card conventions.
// ============================================================

import { useEffect, useState } from 'react';
import {
  AlertTriangle,
  BarChart3,
  IndianRupee,
  Loader2,
  ShieldCheck,
} from 'lucide-react';

import { MessageTemplate } from '@/types';

interface CostEstimate {
  currency: string;
  estimated_total: number;
  cost_per_recipient: number;
  meta_cost: number;
  billable_messages: number;
  verified: boolean;
  warning: string;
}

interface QualityResult {
  score: number;
  grade: string;
  risk_level: 'low' | 'medium' | 'high';
  issues: { code: string; severity: string; message: string }[];
  improvements: string[];
}

const RISK_BADGE: Record<string, string> = {
  low: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
  medium: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
  high: 'bg-red-500/10 text-red-600 dark:text-red-400',
};

export function CampaignInsights({
  template,
  recipientCount,
}: {
  template: MessageTemplate;
  recipientCount: number;
}) {
  const [cost, setCost] = useState<CostEstimate | null>(null);
  const [quality, setQuality] = useState<QualityResult | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function run() {
      setLoading(true);
      try {
        const [costRes, qualRes] = await Promise.all([
          fetch('/api/campaigns/estimate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              category: template.category,
              recipients: recipientCount,
            }),
          }),
          fetch('/api/campaigns/quality', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              body: template.body_text,
              category: template.category,
              buttons: template.buttons,
              footer: template.footer_text,
            }),
          }),
        ]);
        if (cancelled) return;
        if (costRes.ok) setCost((await costRes.json()) as CostEstimate);
        if (qualRes.ok) setQuality((await qualRes.json()) as QualityResult);
      } catch {
        // Best-effort insight card — silence failures, never block the send.
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void run();
    return () => {
      cancelled = true;
    };
  }, [template.category, template.body_text, template.footer_text, template.buttons, recipientCount]);

  if (loading) {
    return (
      <div className="flex items-center gap-2 rounded-xl border border-border bg-muted/40 p-4 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin text-primary" />
        Estimating cost &amp; quality…
      </div>
    );
  }

  if (!cost && !quality) return null;

  return (
    <section className="space-y-2.5">
      <div className="flex items-center gap-1.5">
        <BarChart3 className="h-4 w-4 text-primary" />
        <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Campaign insights
        </h3>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {/* Cost estimate — deterministic, transparent Meta cost. */}
        {cost ? (
          <div className="rounded-xl border border-border bg-muted/40 p-4">
            <div className="mb-2 flex items-center gap-1.5">
              <IndianRupee className="h-4 w-4 text-primary" />
              <p className="text-sm font-medium text-foreground">
                Estimated Meta cost
              </p>
            </div>
            <p className="text-2xl font-semibold tracking-tight text-foreground">
              {cost.currency} {cost.estimated_total.toLocaleString('en-IN')}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {cost.currency} {cost.cost_per_recipient.toLocaleString('en-IN')} per
              recipient · {cost.billable_messages.toLocaleString('en-IN')} messages
            </p>
            <span className="mt-2 inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
              No platform markup
            </span>
            <p className="mt-2 flex items-start gap-1 text-[11px] leading-tight text-amber-600 dark:text-amber-400">
              <AlertTriangle className="mt-0.5 h-3 w-3 shrink-0" />
              <span>{cost.warning}</span>
            </p>
          </div>
        ) : null}

        {/* Quality score — deterministic scorer. */}
        {quality ? (
          <div className="rounded-xl border border-border bg-muted/40 p-4">
            <div className="mb-2 flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="h-4 w-4 text-primary" />
                <p className="text-sm font-medium text-foreground">Quality score</p>
              </div>
              <span
                className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${RISK_BADGE[quality.risk_level] ?? ''}`}
              >
                {quality.risk_level} risk
              </span>
            </div>
            <p className="text-2xl font-semibold tracking-tight text-foreground">
              {quality.score}
              <span className="ml-1 text-sm font-normal text-muted-foreground">
                / 100 · grade {quality.grade}
              </span>
            </p>
            {quality.issues.length > 0 ? (
              <ul className="mt-2 space-y-1">
                {quality.issues.slice(0, 3).map((i) => (
                  <li key={i.code} className="text-xs text-muted-foreground">
                    • {i.message}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-2 text-xs text-emerald-600 dark:text-emerald-400">
                No issues detected.
              </p>
            )}
          </div>
        ) : null}
      </div>
    </section>
  );
}

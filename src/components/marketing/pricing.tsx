import Link from 'next/link';
import { Check } from 'lucide-react';

import { buttonVariants } from '@/components/ui/button';
import { getPublicPricingPlans, formatMonthlyPrice } from '@/lib/marketing/pricing';
import { Section, SectionHeader } from './section';
import { cn } from '@/lib/utils';

// Growth is the plan most India-first SMBs land on once they outgrow
// Starter's limits — highlighted, not because it's the most expensive.
const HIGHLIGHTED_PLAN_ID = 'growth';

export function Pricing() {
  const plans = getPublicPricingPlans();

  return (
    <Section id="pricing" tone="muted">
      <SectionHeader
        eyebrow="Pricing"
        title="One flat platform fee. No per-message markup."
        subtitle="WhatsApp/Meta messaging charges are separate and billed by category — see how campaigns are estimated above."
        align="center"
      />

      <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {plans.map((plan) => {
          const highlighted = plan.id === HIGHLIGHTED_PLAN_ID;
          return (
            <div
              key={plan.id}
              className={cn(
                'flex flex-col rounded-2xl border p-6',
                highlighted
                  ? 'border-primary/40 bg-card shadow-[0_16px_40px_-16px_oklch(0_0_0/0.2)] ring-1 ring-primary/20'
                  : 'border-border bg-card shadow-card',
              )}
            >
              {highlighted ? (
                <span className="mb-3 w-fit rounded-full bg-primary-soft px-2.5 py-1 text-xs font-medium text-primary">
                  Most popular
                </span>
              ) : null}
              <h3 className="text-[15px] font-semibold text-foreground">
                {plan.name}
              </h3>
              <p className="mt-3 flex items-baseline gap-1">
                <span className="text-3xl font-semibold tracking-tight text-foreground [font-family:var(--font-display)]">
                  {formatMonthlyPrice(plan.priceInrMonthly)}
                </span>
                {plan.priceInrMonthly > 0 ? (
                  <span className="text-sm text-muted-foreground">/ month</span>
                ) : null}
              </p>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {plan.description}
              </p>

              <ul className="mt-6 flex-1 space-y-2.5 text-sm">
                {plan.highlights.map((h) => (
                  <li key={h} className="flex items-start gap-2">
                    <Check className="mt-0.5 size-4 shrink-0 text-primary" />
                    <span className="text-foreground">{h}</span>
                  </li>
                ))}
              </ul>

              <Link
                href="/signup"
                className={buttonVariants({
                  variant: highlighted ? 'default' : 'outline',
                  className: 'mt-6 h-10 w-full',
                })}
              >
                {plan.priceInrMonthly === 0 ? 'Start free' : 'Get started'}
              </Link>
            </div>
          );
        })}
      </div>

      <p className="mx-auto mt-8 max-w-2xl text-center text-xs text-muted-foreground">
        WhatsApp/Meta messaging charges are billed separately by category and
        are not included in the platform fee above. Card checkout is
        currently in provider test mode while we finish payment
        verification — sign up free to get started today.
      </p>
    </Section>
  );
}

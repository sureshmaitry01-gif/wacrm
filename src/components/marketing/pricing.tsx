import Link from 'next/link';

import { buttonVariants } from '@/components/ui/button';
import {
  formatMonthlyPrice,
  getPricingMatrix,
  getPublicPricingPlans,
} from '@/lib/marketing/pricing';
import { Band, Inner, SectionHead } from './section';
import { Reveal } from './reveal';
import { cn } from '@/lib/utils';

// Growth is where most India-first SMB teams land once Starter's limits
// bind — marked as the common choice, not as the expensive one.
const HIGHLIGHTED_PLAN_ID = 'growth';

export function Pricing() {
  const plans = getPublicPricingPlans();
  const matrix = getPricingMatrix();

  return (
    <Band id="pricing">
      <Inner>
        <SectionHead
          align="center"
          eyebrow="Pricing"
          title="One flat platform fee. No per-message markup."
          lede="Every number below is the same value the app enforces on your account — read from one catalog, not retyped for the website."
        />

        {/* A matrix, not four cards: plan headers and their limits share
            one ruled grid, so plans are read by comparison rather than by
            scrolling four near-identical lists. */}
        <Reveal delay={120} className="mt-14 sm:mt-16">
          <div className="overflow-x-auto">
            {/* On a phone this scrolls horizontally, so the label column is
                pinned: you can always see which limit a figure belongs to
                instead of losing the row while scrolling the plans. */}
            <div className="min-w-[44rem] overflow-hidden rounded-lg border border-border">
              {/* Plan headers */}
              <div className="grid grid-cols-[minmax(9rem,1.15fr)_repeat(4,minmax(8.25rem,1fr))]">
                <div className="sticky left-0 z-10 flex items-end border-r border-b border-border bg-card-2 px-5 py-6">
                  <span className="text-[10px] tracking-[0.16em] text-muted-foreground uppercase [font-family:var(--font-plex)]">
                    Compare
                  </span>
                </div>
                {plans.map((plan) => {
                  const highlighted = plan.id === HIGHLIGHTED_PLAN_ID;
                  return (
                    <div
                      key={plan.id}
                      className={cn(
                        'border-b border-border px-5 py-6 not-last:border-r',
                        highlighted ? 'bg-mint' : 'bg-card-2',
                      )}
                    >
                      <div className="flex h-4 items-center">
                        {highlighted ? (
                          <span className="text-[10px] tracking-[0.16em] text-primary uppercase [font-family:var(--font-plex)]">
                            Most chosen
                          </span>
                        ) : null}
                      </div>
                      <h3 className="mt-3 text-[14px] font-medium text-foreground">
                        {plan.name}
                      </h3>
                      <p className="mt-2 flex items-baseline gap-1">
                        <span className="text-[1.75rem] leading-none font-medium tracking-[-0.03em] text-foreground [font-family:var(--font-display)]">
                          {formatMonthlyPrice(plan.priceInrMonthly)}
                        </span>
                        {plan.priceInrMonthly > 0 ? (
                          <span className="text-[11px] text-muted-foreground [font-family:var(--font-plex)]">
                            /mo
                          </span>
                        ) : null}
                      </p>
                      <p className="mt-3 min-h-[3.4em] text-[12px] leading-[1.55] text-muted-foreground">
                        {plan.description}
                      </p>
                      <Link
                        href="/signup"
                        className={buttonVariants({
                          variant: highlighted ? 'default' : 'outline',
                          className: 'mt-4 h-9 w-full text-[12.5px]',
                        })}
                      >
                        {plan.priceInrMonthly === 0 ? 'Start free' : 'Get started'}
                      </Link>
                    </div>
                  );
                })}
              </div>

              {/* Limits */}
              {matrix.map((row) => (
                <div
                  key={row.label}
                  className="grid grid-cols-[minmax(9rem,1.15fr)_repeat(4,minmax(8.25rem,1fr))] not-last:border-b not-last:border-border"
                >
                  <div className="sticky left-0 z-10 border-r border-border bg-background px-5 py-3 text-[12.5px] text-foreground">
                    {row.label}
                  </div>
                  {row.values.map((v, i) => (
                    <div
                      key={plans[i].id}
                      className={cn(
                        'px-5 py-3 text-[12.5px] not-last:border-r not-last:border-border [font-family:var(--font-plex)]',
                        plans[i].id === HIGHLIGHTED_PLAN_ID && 'bg-mint',
                        v === '—' ? 'text-muted-foreground/60' : 'text-muted-foreground',
                      )}
                    >
                      {v}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
          <p className="mt-3 text-[11px] text-muted-foreground lg:hidden [font-family:var(--font-plex)]">
            Scroll sideways to compare all four plans →
          </p>
        </Reveal>

        <Reveal delay={60}>
          <p className="mx-auto mt-8 max-w-[62ch] text-center text-[12.5px] leading-relaxed text-muted-foreground">
            WhatsApp/Meta messaging charges are separate where applicable and are
            not included in the platform fee. Card checkout is in provider test
            mode while payment verification is finished — the free plan is live
            and needs no card.
          </p>
        </Reveal>
      </Inner>
    </Band>
  );
}

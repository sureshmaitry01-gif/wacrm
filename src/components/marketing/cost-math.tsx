import { cn } from '@/lib/utils';

/**
 * ============================================================
 * THE ARITHMETIC
 *
 * The page's signature element. This product's actual claim is not
 * "send WhatsApp campaigns" — it is "know what the send costs before
 * you commit". So the estimate is set as a real equation, with each
 * operand labelled by where it came from, rather than as a headline
 * figure the reader is asked to trust.
 *
 * It appears twice: compact, straddling the hero's product frame, and
 * full width as the centerpiece of the economics section.
 *
 * Every figure here is illustrative and says so. No live Meta India
 * rate is asserted anywhere on the public site — the numbers stand in
 * for the shape of the calculation, not for a current rate card.
 * ============================================================
 */

const RECIPIENTS = '4,200';
const RATE = '₹0.8630';
const TOTAL = '~₹3,625';

/** Compact form — sits on the edge of the hero's product frame. */
export function CostChip({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'w-[17.5rem] rounded-lg border border-border bg-card p-4',
        'shadow-[0_1px_2px_oklch(0_0_0/0.05),0_20px_44px_-20px_oklch(0.205_0.012_160/0.35)]',
        className,
      )}
    >
      <p className="text-[10px] tracking-[0.16em] text-muted-foreground uppercase [font-family:var(--font-plex)]">
        Estimated cost
      </p>
      <p className="mt-2 text-[1.75rem] leading-none font-medium tracking-[-0.02em] text-foreground [font-family:var(--font-display)]">
        {TOTAL}
      </p>
      <p className="mt-2.5 text-[11.5px] text-muted-foreground [font-family:var(--font-plex)]">
        {RECIPIENTS} × {RATE} / delivered
      </p>
      <p className="mt-2 border-t border-border pt-2 text-[10.5px] leading-relaxed text-muted-foreground">
        Illustrative. Assumptions are shown before you send.
      </p>
    </div>
  );
}

const OPERANDS: {
  value: string;
  unit: string;
  source: string;
  emphasis?: boolean;
}[] = [
  {
    value: RECIPIENTS,
    unit: 'recipients',
    source: 'From the audience you picked — everyone, a tag, a custom field, or a CSV.',
  },
  {
    value: RATE,
    unit: 'per delivered message',
    source: 'From the configured rate card, for this template’s category.',
  },
  {
    value: TOTAL,
    unit: 'estimated campaign cost',
    source: 'Every message priced as billable, no volume discount assumed.',
    emphasis: true,
  },
];

/** Full-width editorial form — the economics section's centerpiece. */
export function CostEquation() {
  return (
    <div className="border-y border-border">
      <dl className="grid sm:grid-cols-3 sm:divide-x sm:divide-border">
        {OPERANDS.map((op, i) => (
          <div key={op.unit} className="relative border-b border-border px-1 py-8 last:border-b-0 sm:border-b-0 sm:px-8 sm:py-10 sm:first:pl-0 sm:last:pr-0">
            {/* The operator that joins this cell to the previous one,
                floated onto the dividing rule. */}
            {i > 0 ? (
              <span
                aria-hidden
                className="absolute -top-3.5 left-1 hidden size-7 items-center justify-center rounded-full border border-border bg-background text-xs text-muted-foreground sm:-left-3.5 sm:top-1/2 sm:flex sm:-translate-y-1/2 [font-family:var(--font-plex)]"
              >
                {i === 1 ? '×' : '='}
              </span>
            ) : null}
            <dt
              className={cn(
                'text-[clamp(1.9rem,4.4vw,3rem)] leading-none font-medium tracking-[-0.035em] [font-family:var(--font-display)]',
                op.emphasis ? 'text-primary' : 'text-foreground',
              )}
            >
              {op.value}
            </dt>
            <dd className="mt-3">
              <p className="text-[11px] tracking-[0.14em] text-muted-foreground uppercase [font-family:var(--font-plex)]">
                {op.unit}
              </p>
              <p className="mt-3 max-w-[26ch] text-[13.5px] leading-relaxed text-muted-foreground">
                {op.source}
              </p>
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

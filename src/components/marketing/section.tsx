import { cn } from '@/lib/utils';
import { Reveal } from './reveal';

/**
 * ============================================================
 * PAGE STRUCTURE
 *
 * The public site is built as a drawing, not a stack of cards: one
 * centered column bounded by hairline rules, with sections separated by
 * a single rule rather than by floating panels. `Shell` draws the two
 * vertical rules; `Band` draws the horizontal one under each section.
 *
 * The effect is that every section shares the same measured frame, and
 * a "card" is a *cell in that frame* rather than an independent widget
 * with its own shadow and radius.
 * ============================================================
 */

/** The full-page column. Its own left/right borders are the site's
 *  vertical structural rules. */
export function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto w-full max-w-[1440px] border-border md:border-x">{children}</div>
  );
}

type BandTone = 'paper' | 'raised' | 'mint' | 'ink';

const BAND_TONE: Record<BandTone, string> = {
  paper: 'bg-background',
  raised: 'bg-card-2',
  mint: 'bg-mint',
  // The single dark moment on the page. Rebinds the semantic tokens
  // locally so nested primitives — frames, rules, muted copy — invert
  // with it automatically instead of needing dark-specific classes.
  ink: 'bg-ink text-foreground [--background:var(--ink)] [--border:var(--ink-line)] [--card:var(--ink-2)] [--card-2:var(--ink-2)] [--foreground:var(--ink-fg)] [--muted-foreground:var(--ink-muted)]',
};

/** One horizontal band of the page. */
export function Band({
  id,
  tone = 'paper',
  className,
  children,
  divide = true,
}: {
  id?: string;
  tone?: BandTone;
  className?: string;
  children: React.ReactNode;
  /** Draw the hairline that separates this band from the next. */
  divide?: boolean;
}) {
  return (
    <section
      id={id}
      className={cn(
        'relative',
        BAND_TONE[tone],
        divide && 'border-b border-border',
        className,
      )}
    >
      {children}
    </section>
  );
}

/** The content measure. Padding is deliberately generous — the page's
 *  main luxury is the space it refuses to fill. */
export function Inner({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn('mx-auto max-w-6xl px-6 py-20 sm:px-10 sm:py-28', className)}>
      {children}
    </div>
  );
}

/**
 * Flush hairline grid.
 *
 * The gap itself is the rule: a 1px grid gap over a border-colored
 * background, with each cell painting its own surface. Cells can span
 * any number of rows or columns and the grid stays perfectly ruled with
 * no per-cell border bookkeeping — which is what lets the bento vary
 * cell sizes without turning into a set of floating rounded widgets.
 */
export function GridFrame({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        'grid gap-px overflow-hidden rounded-lg border border-border bg-border',
        className,
      )}
    >
      {children}
    </div>
  );
}

export function Cell({
  className,
  tone = 'paper',
  children,
}: {
  className?: string;
  tone?: 'paper' | 'raised' | 'mint';
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        'p-6 sm:p-7',
        tone === 'paper' && 'bg-background',
        tone === 'raised' && 'bg-card-2',
        tone === 'mint' && 'bg-mint',
        className,
      )}
    >
      {children}
    </div>
  );
}

/** The small mono label that opens a grid cell. */
export function CellLabel({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <p
      className={cn(
        'text-[10px] tracking-[0.16em] text-muted-foreground uppercase [font-family:var(--font-plex)]',
        className,
      )}
    >
      {children}
    </p>
  );
}

/**
 * Eyebrow: a short green rule followed by a mono label. The mono is not
 * decoration — the utility face is reserved throughout the site for
 * labels and measured values, which is what an eyebrow is.
 */
export function Eyebrow({
  children,
  className,
  tone = 'primary',
}: {
  children: React.ReactNode;
  className?: string;
  tone?: 'primary' | 'ai' | 'ink';
}) {
  return (
    <p
      className={cn(
        'flex items-center gap-2.5 text-[11px] tracking-[0.16em] uppercase [font-family:var(--font-plex)]',
        tone === 'primary' && 'text-primary',
        tone === 'ai' && 'text-ai',
        tone === 'ink' && 'text-signal',
        className,
      )}
    >
      <span
        aria-hidden
        className={cn(
          'h-px w-6 shrink-0',
          tone === 'primary' && 'bg-primary',
          tone === 'ai' && 'bg-ai',
          tone === 'ink' && 'bg-signal',
        )}
      />
      {children}
    </p>
  );
}

/**
 * Display heading. Tight tracking and a 1.05 leading is what separates
 * an editorial heading from body copy set large.
 */
export function Heading({
  children,
  level = 2,
  size = 'md',
  className,
}: {
  children: React.ReactNode;
  level?: 1 | 2 | 3;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}) {
  const Tag = `h${level}` as const;
  return (
    <Tag
      className={cn(
        'text-balance text-foreground [font-family:var(--font-display)]',
        'font-medium tracking-[-0.028em]',
        size === 'sm' && 'text-[clamp(1.5rem,2.6vw,1.95rem)] leading-[1.12]',
        size === 'md' && 'text-[clamp(1.95rem,3.6vw,2.9rem)] leading-[1.06]',
        size === 'lg' && 'text-[clamp(2.4rem,5.2vw,4rem)] leading-[1.02] tracking-[-0.035em]',
        className,
      )}
    >
      {children}
    </Tag>
  );
}

/** Supporting paragraph. Held to a narrow measure on purpose. */
export function Lede({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <p
      className={cn(
        'max-w-[54ch] text-[15px] leading-[1.7] text-muted-foreground sm:text-base',
        className,
      )}
    >
      {children}
    </p>
  );
}

/** Eyebrow + heading + lede, revealed as one group. */
export function SectionHead({
  eyebrow,
  title,
  lede,
  align = 'left',
  tone = 'primary',
  size = 'md',
  className,
}: {
  eyebrow?: string;
  title: React.ReactNode;
  lede?: React.ReactNode;
  align?: 'left' | 'center';
  tone?: 'primary' | 'ai' | 'ink';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}) {
  return (
    <Reveal
      className={cn(
        'max-w-[46rem]',
        align === 'center' && 'mx-auto flex flex-col items-center text-center',
        className,
      )}
    >
      {eyebrow ? <Eyebrow tone={tone}>{eyebrow}</Eyebrow> : null}
      <Heading size={size} className={cn(eyebrow && 'mt-5')}>
        {title}
      </Heading>
      {lede ? <Lede className={cn('mt-5', align === 'center' && 'text-center')}>{lede}</Lede> : null}
    </Reveal>
  );
}

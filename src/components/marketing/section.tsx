import { cn } from '@/lib/utils';

/**
 * Shared section shell for the landing page — consistent max-width,
 * vertical rhythm, and an optional eyebrow/heading/subhead block so every
 * section reads as one system without repeating the same header markup.
 */
export function Section({
  id,
  className,
  children,
  tone = 'default',
}: {
  id?: string;
  className?: string;
  children: React.ReactNode;
  /** 'ai' tints the section surface with the reserved indigo accent. */
  tone?: 'default' | 'muted' | 'ai';
}) {
  return (
    <section
      id={id}
      className={cn(
        'relative py-20 sm:py-28',
        tone === 'muted' && 'bg-card-2',
        tone === 'ai' && 'bg-ai-soft',
        className,
      )}
    >
      <div className="mx-auto max-w-6xl px-6">{children}</div>
    </section>
  );
}

export function SectionHeader({
  eyebrow,
  title,
  subtitle,
  align = 'left',
  className,
}: {
  eyebrow?: string;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  align?: 'left' | 'center';
  className?: string;
}) {
  return (
    <div
      className={cn(
        'max-w-2xl',
        align === 'center' && 'mx-auto text-center',
        className,
      )}
    >
      {eyebrow ? (
        <p className="mb-3 text-xs font-semibold tracking-[0.14em] text-primary uppercase">
          {eyebrow}
        </p>
      ) : null}
      <h2 className="text-[clamp(1.75rem,3.4vw,2.5rem)] leading-[1.1] font-medium tracking-tight text-foreground [font-family:var(--font-display)]">
        {title}
      </h2>
      {subtitle ? (
        <p className="mt-4 text-base leading-relaxed text-muted-foreground sm:text-lg">
          {subtitle}
        </p>
      ) : null}
    </div>
  );
}

import { cn } from '@/lib/utils';

/**
 * Product-UI chrome.
 *
 * Every product visual on the public site is a composed rendering built
 * from the app's own layout patterns and real copy — never a stock
 * illustration and never an invented screen. The chrome is deliberately
 * an *application* titlebar rather than a browser one (no traffic-light
 * dots): the reader should read "this is the tool", not "this is a
 * screenshot of a website".
 *
 * Shadows stay in the 1px + long-soft-drop range. Depth here comes from
 * the hairline border and the surface change, not from a glow.
 */
export function AppFrame({
  title,
  className,
  bodyClassName,
  children,
}: {
  /** Shown in the titlebar, set in the utility face like a real path. */
  title: string;
  className?: string;
  bodyClassName?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        'overflow-hidden rounded-xl border border-border bg-card',
        'shadow-[0_1px_2px_oklch(0_0_0/0.04),0_28px_56px_-32px_oklch(0.205_0.012_160/0.3)]',
        className,
      )}
    >
      <div className="flex items-center gap-2.5 border-b border-border bg-card-2 px-3.5 py-2.5">
        <span aria-hidden className="size-1.5 shrink-0 rounded-full bg-signal" />
        <span className="truncate text-[11px] text-muted-foreground [font-family:var(--font-plex)]">
          {title}
        </span>
        <span aria-hidden className="ml-auto flex shrink-0 items-center gap-1">
          <span className="h-px w-3 bg-foreground/15" />
          <span className="h-px w-3 bg-foreground/15" />
        </span>
      </div>
      <div className={cn('bg-card', bodyClassName)}>{children}</div>
    </div>
  );
}

/** The small caption that sits under a product visual to keep an
 *  illustrative figure honest. */
export function FrameCaption({ children }: { children: React.ReactNode }) {
  return (
    <p className="mt-4 text-xs leading-relaxed text-muted-foreground [font-family:var(--font-plex)]">
      {children}
    </p>
  );
}

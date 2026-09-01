import { cn } from '@/lib/utils';

/**
 * A composed "app window" frame used to present product-UI mockups built
 * from the app's own primitives (Card/Badge/Button), rather than fake
 * illustrations or invented screenshots. Every mockup rendered inside one
 * of these reuses real copy and real feature shapes from the product.
 */
export function BrowserFrame({
  title,
  className,
  children,
}: {
  title: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        'overflow-hidden rounded-2xl border border-border bg-card shadow-[0_20px_60px_-20px_oklch(0_0_0/0.18)] ring-1 ring-foreground/5',
        className,
      )}
    >
      <div className="flex items-center gap-2 border-b border-border bg-card-2 px-4 py-2.5">
        <span className="size-2.5 rounded-full bg-foreground/15" />
        <span className="size-2.5 rounded-full bg-foreground/15" />
        <span className="size-2.5 rounded-full bg-foreground/15" />
        <span className="ml-2 truncate text-xs text-muted-foreground">
          {title}
        </span>
      </div>
      <div className="bg-background">{children}</div>
    </div>
  );
}

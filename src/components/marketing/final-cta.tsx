import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

import { buttonVariants } from '@/components/ui/button';
import { PRODUCT_NAME } from '@/lib/marketing/product';

export function FinalCTA() {
  return (
    <section className="border-t border-border bg-card-2">
      <div className="mx-auto max-w-3xl px-6 py-20 text-center sm:py-24">
        <h2 className="text-[clamp(1.75rem,3.6vw,2.75rem)] leading-[1.1] font-medium tracking-tight text-foreground [font-family:var(--font-display)]">
          Run your next WhatsApp campaign with a plan, not a guess.
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
          Connect WhatsApp, add your contacts, and see your first cost
          estimate in minutes — free to start with {PRODUCT_NAME}.
        </p>
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            href="/signup"
            className={buttonVariants({ size: 'lg', className: 'h-11 px-6 text-[15px]' })}
          >
            Start free
            <ArrowRight className="size-4" />
          </Link>
          <Link
            href="/login"
            className={buttonVariants({
              variant: 'outline',
              size: 'lg',
              className: 'h-11 px-6 text-[15px]',
            })}
          >
            Sign in
          </Link>
        </div>
      </div>
    </section>
  );
}

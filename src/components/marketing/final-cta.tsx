import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

import { buttonVariants } from '@/components/ui/button';
import { Band, Heading } from './section';
import { Reveal } from './reveal';

export function FinalCTA() {
  return (
    <Band>
      <div className="relative overflow-hidden">
        <div
          aria-hidden
          className="m-dotfield pointer-events-none absolute inset-0 [mask-image:radial-gradient(70%_60%_at_50%_50%,black,transparent)]"
        />
        <div className="relative mx-auto max-w-6xl px-6 py-28 sm:px-10 sm:py-36">
          <Reveal>
            {/* The measure lives on the heading, not the wrapper: `ch`
                resolves against the element's own font-size, so a 20ch
                cap on a 16px wrapper would be ~160px wide and shatter a
                64px display line into one word per row. */}
            <Heading level={2} size="lg" className="max-w-[22ch]">
              Send the next one with a number, not a guess.
            </Heading>
          </Reveal>

          <Reveal delay={110}>
            <p className="mt-7 max-w-[46ch] text-[15px] leading-[1.7] text-muted-foreground sm:text-base">
              Connect WhatsApp, import your contacts, and see your first cost
              estimate in an afternoon.
            </p>

            <div className="mt-9 flex flex-wrap items-center gap-x-7 gap-y-3">
              <Link
                href="/signup"
                className={buttonVariants({
                  className: 'group/cta h-11 gap-2 px-5 text-[14px]',
                })}
              >
                Start free
                <ArrowRight className="size-4 transition-transform duration-200 group-hover/cta:translate-x-0.5" />
              </Link>
              <Link
                href="/login"
                className="text-[14px] font-medium text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline"
              >
                Sign in
              </Link>
            </div>
          </Reveal>
        </div>
      </div>
    </Band>
  );
}

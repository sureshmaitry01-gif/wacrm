'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Menu, X } from 'lucide-react';

import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { PRODUCT_NAME } from '@/lib/marketing/product';
import { Wordmark } from './symbols';

const LINKS = [
  { href: '/#product', label: 'How it works' },
  { href: '/#features', label: 'Campaigns' },
  { href: '/#pricing', label: 'Pricing' },
  { href: '/#faq', label: 'FAQ' },
];

export function MarketingNav() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-[1440px] items-center justify-between px-6 sm:h-[72px] sm:px-10">
        <Link href="/" className="rounded-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/40">
          <Wordmark label={PRODUCT_NAME} />
        </Link>

        <nav className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-9 lg:flex">
          {LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-[13px] text-muted-foreground transition-colors hover:text-foreground"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="hidden items-center gap-1 lg:flex">
          <Link
            href="/login"
            className={buttonVariants({
              variant: 'ghost',
              className: 'h-9 px-3 text-[13px]',
            })}
          >
            Sign in
          </Link>
          <Link
            href="/signup"
            className={buttonVariants({ className: 'h-9 px-4 text-[13px]' })}
          >
            Start free
          </Link>
        </div>

        <button
          type="button"
          aria-label={open ? 'Close menu' : 'Open menu'}
          aria-expanded={open}
          aria-controls="mobile-nav"
          onClick={() => setOpen((v) => !v)}
          className="-mr-2 flex size-10 items-center justify-center rounded-md text-foreground outline-none focus-visible:ring-3 focus-visible:ring-ring/40 lg:hidden"
        >
          {open ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
      </div>

      {/* A max-height transition rather than a grid-template one:
          arbitrary values (`grid-rows-[1fr]`, `max-h-[24rem]`) do not
          generate CSS in this build, while scale values like `max-h-96`
          do. `overflow-y-auto` rather than `overflow-hidden` so the
          panel scrolls instead of trapping links if the list ever grows
          past the cap. */}
      <div
        id="mobile-nav"
        className={cn(
          'overflow-x-hidden border-border transition-[max-height] duration-200 ease-out lg:hidden',
          open ? 'max-h-96 overflow-y-auto border-t' : 'max-h-0 overflow-y-hidden',
        )}
      >
        <nav className="flex flex-col px-6 py-3">
          {LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              onClick={() => setOpen(false)}
              className="border-b border-border py-3.5 text-sm text-muted-foreground transition-colors last:border-b-0 hover:text-foreground"
            >
              {link.label}
            </a>
          ))}
          <div className="mt-4 mb-2 flex flex-col gap-2">
            <Link
              href="/signup"
              onClick={() => setOpen(false)}
              className={buttonVariants({ className: 'h-11' })}
            >
              Start free
            </Link>
            <Link
              href="/login"
              onClick={() => setOpen(false)}
              className={buttonVariants({ variant: 'outline', className: 'h-11' })}
            >
              Sign in
            </Link>
          </div>
        </nav>
      </div>
    </header>
  );
}

import Link from 'next/link';
import { MessageCircle } from 'lucide-react';

import { PRODUCT_NAME } from '@/lib/marketing/product';

const COLUMNS: { title: string; links: { href: string; label: string }[] }[] = [
  {
    title: 'Product',
    links: [
      { href: '/#product', label: 'Product' },
      { href: '/#features', label: 'Features' },
      { href: '/#pricing', label: 'Pricing' },
      { href: '/#faq', label: 'FAQ' },
    ],
  },
  {
    title: 'Account',
    links: [
      { href: '/signup', label: 'Start free' },
      { href: '/login', label: 'Sign in' },
    ],
  },
  {
    title: 'Legal & support',
    links: [
      { href: '/privacy', label: 'Privacy' },
      { href: '/terms', label: 'Terms' },
      { href: '/support', label: 'Support' },
    ],
  },
];

export function Footer() {
  return (
    <footer className="border-t border-border">
      <div className="mx-auto max-w-6xl px-6 py-14">
        <div className="grid gap-10 sm:grid-cols-[1.3fr_1fr_1fr_1fr]">
          <div>
            <div className="flex items-center gap-2 text-[15px] font-semibold text-foreground">
              <span className="flex size-7 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <MessageCircle className="size-4" />
              </span>
              {PRODUCT_NAME}
            </div>
            <p className="mt-3 max-w-xs text-sm leading-relaxed text-muted-foreground">
              WhatsApp campaigns and a shared team inbox, with transparent
              costs and AI-assisted drafting.
            </p>
          </div>
          {COLUMNS.map((col) => (
            <div key={col.title}>
              <h3 className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                {col.title}
              </h3>
              <ul className="mt-3 space-y-2.5">
                {col.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-col gap-2 border-t border-border pt-6 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} {PRODUCT_NAME}. All rights reserved.</p>
          <p>Not affiliated with, endorsed by, or a partner of WhatsApp or Meta.</p>
        </div>
      </div>
    </footer>
  );
}

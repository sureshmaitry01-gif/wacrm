import Link from 'next/link';

import { PRODUCT_NAME } from '@/lib/marketing/product';
import { Wordmark } from './symbols';

const COLUMNS: { title: string; links: { href: string; label: string }[] }[] = [
  {
    title: 'Product',
    links: [
      { href: '/#product', label: 'How it works' },
      { href: '/#features', label: 'Campaigns' },
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
    <footer className="border-t border-border bg-card-2">
      <div className="mx-auto max-w-6xl px-6 py-16 sm:px-10 sm:py-20">
        <div className="grid gap-x-10 gap-y-12 sm:grid-cols-2 lg:grid-cols-[1.6fr_1fr_1fr_1fr]">
          <div>
            <Wordmark label={PRODUCT_NAME} />
            <p className="mt-4 max-w-[34ch] text-[13px] leading-[1.7] text-muted-foreground">
              WhatsApp campaigns and a shared team inbox, with the cost of a
              send shown before you commit to it.
            </p>
          </div>

          {COLUMNS.map((col) => (
            <div key={col.title}>
              <h3 className="text-[10.5px] tracking-[0.16em] text-muted-foreground uppercase [font-family:var(--font-plex)]">
                {col.title}
              </h3>
              <ul className="mt-5 space-y-3">
                {col.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-[13.5px] text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-16 flex flex-col gap-3 border-t border-border pt-7 text-[11.5px] text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {new Date().getFullYear()} {PRODUCT_NAME}
          </p>
          <p className="max-w-[46ch] sm:text-right">
            Not affiliated with, endorsed by, or a partner of WhatsApp or Meta.
          </p>
        </div>
      </div>
    </footer>
  );
}

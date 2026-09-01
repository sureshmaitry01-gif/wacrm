import type { Metadata } from 'next';
import Link from 'next/link';

import { MarketingNav } from '@/components/marketing/nav';
import { Footer } from '@/components/marketing/footer';
import { PRODUCT_NAME } from '@/lib/marketing/product';

export const metadata: Metadata = {
  title: 'Support',
  description: `Get help with ${PRODUCT_NAME}.`,
  robots: { index: true, follow: true },
};

export default function SupportPage() {
  return (
    <div className="landing-scope min-h-screen">
      <MarketingNav />
      <main className="mx-auto max-w-3xl px-6 py-16 sm:py-20">
        <h1 className="text-3xl font-medium tracking-tight text-foreground [font-family:var(--font-display)]">
          Support
        </h1>
        <p className="mt-4 text-base leading-relaxed text-muted-foreground">
          {PRODUCT_NAME} is currently in beta. A dedicated support channel
          is being finalized before public launch.
        </p>

        <div className="mt-10 space-y-6 text-sm leading-relaxed text-foreground">
          <section>
            <h2 className="text-base font-semibold">In the meantime</h2>
            <p className="mt-2 text-muted-foreground">
              If you already have an account, the fastest way to reach us is
              through the account you signed up with. If you&apos;re evaluating
              the product,{' '}
              <Link href="/signup" className="underline underline-offset-2">
                start a free account
              </Link>{' '}
              and use the in-app contact once you&apos;re signed in.
            </p>
          </section>
          <section>
            <h2 className="text-base font-semibold">Something not working?</h2>
            <p className="mt-2 text-muted-foreground">
              WhatsApp message delivery and template approval are handled by
              Meta and can occasionally be delayed or rejected independent
              of the platform — see the{' '}
              <Link href="/#faq" className="underline underline-offset-2">
                FAQ
              </Link>{' '}
              for what to expect.
            </p>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
}

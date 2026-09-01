import type { Metadata } from 'next';
import Link from 'next/link';

import { MarketingNav } from '@/components/marketing/nav';
import { Footer } from '@/components/marketing/footer';
import { PRODUCT_NAME } from '@/lib/marketing/product';

export const metadata: Metadata = {
  title: 'Terms of Service',
  description: `The terms for using ${PRODUCT_NAME}.`,
  robots: { index: true, follow: true },
};

export default function TermsPage() {
  return (
    <div className="landing-scope min-h-screen">
      <MarketingNav />
      <main className="mx-auto max-w-3xl px-6 py-16 sm:py-20">
        <h1 className="text-3xl font-medium tracking-tight text-foreground [font-family:var(--font-display)]">
          Terms of Service
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          This is an early-stage summary while {PRODUCT_NAME} is in beta. It
          will be replaced with full terms before public launch.
        </p>

        <div className="mt-10 space-y-8 text-sm leading-relaxed text-foreground">
          <section>
            <h2 className="text-base font-semibold">The service</h2>
            <p className="mt-2 text-muted-foreground">
              {PRODUCT_NAME} provides WhatsApp campaign, shared-inbox, and
              contact-management tools built on the official WhatsApp
              Business Platform. We are not WhatsApp or Meta, and this
              service is not an official WhatsApp or Meta product.
            </p>
          </section>
          <section>
            <h2 className="text-base font-semibold">Your responsibilities</h2>
            <p className="mt-2 text-muted-foreground">
              You are responsible for the content of messages you send,
              compliance with WhatsApp&apos;s and Meta&apos;s own policies for your
              connected number, and for having a lawful basis to message
              your contacts.
            </p>
          </section>
          <section>
            <h2 className="text-base font-semibold">Billing</h2>
            <p className="mt-2 text-muted-foreground">
              The platform fee shown on the{' '}
              <Link href="/#pricing" className="underline underline-offset-2">
                pricing page
              </Link>{' '}
              covers software access. WhatsApp/Meta&apos;s own per-message
              charges are billed separately and are not part of the platform
              fee. Some billing functionality is still being finished during
              our beta period.
            </p>
          </section>
          <section>
            <h2 className="text-base font-semibold">No guarantees</h2>
            <p className="mt-2 text-muted-foreground">
              We do not guarantee message delivery, template approval, or
              campaign results — these depend on Meta&apos;s own systems and
              policies, which are outside our control.
            </p>
          </section>
          <section>
            <h2 className="text-base font-semibold">Changes</h2>
            <p className="mt-2 text-muted-foreground">
              These terms will be updated as the product moves from beta to
              general availability.
            </p>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
}

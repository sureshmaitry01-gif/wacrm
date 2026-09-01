import type { Metadata } from 'next';
import Link from 'next/link';

import { MarketingNav } from '@/components/marketing/nav';
import { Footer } from '@/components/marketing/footer';
import { PRODUCT_NAME } from '@/lib/marketing/product';

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: `How ${PRODUCT_NAME} handles customer and account data.`,
  robots: { index: true, follow: true },
};

export default function PrivacyPage() {
  return (
    <div className="landing-scope min-h-screen">
      <MarketingNav />
      <main className="mx-auto max-w-3xl px-6 py-16 sm:py-20">
        <h1 className="text-3xl font-medium tracking-tight text-foreground [font-family:var(--font-display)]">
          Privacy Policy
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          This is an early-stage summary while {PRODUCT_NAME} is in beta. It
          will be replaced with a full policy before public launch.
        </p>

        <div className="mt-10 space-y-8 text-sm leading-relaxed text-foreground">
          <section>
            <h2 className="text-base font-semibold">What we collect</h2>
            <p className="mt-2 text-muted-foreground">
              Account information you provide at signup (name, email),
              WhatsApp contact and conversation data you add or that flows
              through your connected WhatsApp Business number, and basic
              product usage needed to operate the service (e.g. plan usage
              counters).
            </p>
          </section>
          <section>
            <h2 className="text-base font-semibold">How data is isolated</h2>
            <p className="mt-2 text-muted-foreground">
              Every account&apos;s data is scoped and access-controlled at the
              database level, so one account cannot read another
              account&apos;s contacts, conversations, or campaigns.
            </p>
          </section>
          <section>
            <h2 className="text-base font-semibold">Third parties</h2>
            <p className="mt-2 text-muted-foreground">
              Messages are sent through Meta&apos;s WhatsApp Business Platform.
              Optional AI drafting features send the business brief you
              provide to an AI model provider to generate a draft. Payment
              processing, where enabled, is handled by our payment provider
              — we do not store your card details.
            </p>
          </section>
          <section>
            <h2 className="text-base font-semibold">Your data, your account</h2>
            <p className="mt-2 text-muted-foreground">
              You can request export or deletion of your account data by
              contacting us — see{' '}
              <Link href="/support" className="underline underline-offset-2">
                Support
              </Link>
              .
            </p>
          </section>
          <section>
            <h2 className="text-base font-semibold">Changes</h2>
            <p className="mt-2 text-muted-foreground">
              This policy will be updated as the product moves from beta to
              general availability. Material changes will be reflected on
              this page.
            </p>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
}

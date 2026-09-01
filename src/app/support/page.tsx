import type { Metadata } from 'next';
import Link from 'next/link';

import { LegalPage, LegalSection } from '@/components/marketing/legal-page';
import { PRODUCT_NAME } from '@/lib/marketing/product';

export const metadata: Metadata = {
  title: 'Support',
  description: `Get help with ${PRODUCT_NAME}.`,
  robots: { index: true, follow: true },
};

export default function SupportPage() {
  return (
    <LegalPage
      eyebrow="Beta"
      title="Support"
      intro={`${PRODUCT_NAME} is currently in beta. A dedicated support channel is being finalised before public launch.`}
    >
      <LegalSection title="In the meantime">
        If you already have an account, the fastest way to reach us is through
        the account you signed up with. If you&apos;re evaluating the product,{' '}
        <Link href="/signup">start a free account</Link> and use the in-app
        contact once you&apos;re signed in.
      </LegalSection>

      <LegalSection title="Something not working?">
        WhatsApp message delivery and template approval are handled by Meta and
        can occasionally be delayed or rejected independently of the platform —
        see the <Link href="/#faq">FAQ</Link> for what to expect.
      </LegalSection>
    </LegalPage>
  );
}

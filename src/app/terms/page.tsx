import type { Metadata } from 'next';
import Link from 'next/link';

import { LegalPage, LegalSection } from '@/components/marketing/legal-page';
import { PRODUCT_NAME } from '@/lib/marketing/product';

export const metadata: Metadata = {
  title: 'Terms of Service',
  description: `The terms for using ${PRODUCT_NAME}.`,
  robots: { index: true, follow: true },
};

export default function TermsPage() {
  return (
    <LegalPage
      eyebrow="Beta summary"
      title="Terms of Service"
      intro={`This is an early-stage summary while ${PRODUCT_NAME} is in beta. It will be replaced with full terms before public launch.`}
    >
      <LegalSection title="The service">
        {PRODUCT_NAME} provides WhatsApp campaign, shared-inbox and
        contact-management tools built on the official WhatsApp Business
        Platform. We are not WhatsApp or Meta, and this service is not an
        official WhatsApp or Meta product.
      </LegalSection>

      <LegalSection title="Your responsibilities">
        You are responsible for the content of the messages you send, for
        compliance with WhatsApp&apos;s and Meta&apos;s own policies for your
        connected number, and for having a lawful basis to message your
        contacts.
      </LegalSection>

      <LegalSection title="Billing">
        The platform fee shown on the <Link href="/#pricing">pricing page</Link>{' '}
        covers software access. WhatsApp/Meta&apos;s own per-message charges are
        billed separately and are not part of the platform fee. Some billing
        functionality is still being finished during our beta period.
      </LegalSection>

      <LegalSection title="No guarantees">
        We do not guarantee message delivery, template approval, or campaign
        results — these depend on Meta&apos;s own systems and policies, which are
        outside our control.
      </LegalSection>

      <LegalSection title="Changes">
        These terms will be updated as the product moves from beta to general
        availability.
      </LegalSection>
    </LegalPage>
  );
}

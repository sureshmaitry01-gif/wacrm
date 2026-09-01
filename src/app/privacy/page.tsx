import type { Metadata } from 'next';
import Link from 'next/link';

import { LegalPage, LegalSection } from '@/components/marketing/legal-page';
import { PRODUCT_NAME } from '@/lib/marketing/product';

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: `How ${PRODUCT_NAME} handles customer and account data.`,
  robots: { index: true, follow: true },
};

export default function PrivacyPage() {
  return (
    <LegalPage
      eyebrow="Beta summary"
      title="Privacy Policy"
      intro={`This is an early-stage summary while ${PRODUCT_NAME} is in beta. It will be replaced with a full policy before public launch.`}
    >
      <LegalSection title="What we collect">
        Account information you provide at signup (name, email), WhatsApp
        contact and conversation data you add or that flows through your
        connected WhatsApp Business number, and the basic product usage needed
        to operate the service — for example, plan usage counters.
      </LegalSection>

      <LegalSection title="How data is isolated">
        Every account&apos;s data is scoped and access-controlled at the database
        level, so one account cannot read another account&apos;s contacts,
        conversations, or campaigns.
      </LegalSection>

      <LegalSection title="Third parties">
        Messages are sent through Meta&apos;s WhatsApp Business Platform. Optional
        AI drafting features send the business brief you provide to an AI model
        provider to generate a draft. Payment processing, where enabled, is
        handled by our payment provider — we do not store your card details.
      </LegalSection>

      <LegalSection title="Your data, your account">
        You can request export or deletion of your account data by contacting
        us — see <Link href="/support">Support</Link>.
      </LegalSection>

      <LegalSection title="Changes">
        This policy will be updated as the product moves from beta to general
        availability. Material changes will be reflected on this page.
      </LegalSection>
    </LegalPage>
  );
}

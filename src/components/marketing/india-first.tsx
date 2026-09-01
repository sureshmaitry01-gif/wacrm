import { IndianRupee, Languages, Smartphone, Users } from 'lucide-react';

import { Section, SectionHeader } from './section';

const POINTS = [
  {
    icon: IndianRupee,
    title: 'Priced and billed in ₹',
    body: 'Plans are INR-first, built around what a small Indian business actually spends.',
  },
  {
    icon: Languages,
    title: 'Hindi & Hinglish campaign writing',
    body: 'The AI writer drafts in हिंदी and Hinglish, the way sellers and customers actually message each other.',
  },
  {
    icon: Smartphone,
    title: 'WhatsApp is the channel, not a bolt-on',
    body: 'Campaigns, inbox, and templates are all built around the WhatsApp Business API — it isn’t one integration among many.',
  },
  {
    icon: Users,
    title: 'Built for SMB teams',
    body: 'Shared inbox, roles, and campaign limits are sized for a small sales, support, or campaign team — not an enterprise contact center.',
  },
];

export function IndiaFirst() {
  return (
    <Section tone="muted">
      <SectionHeader
        eyebrow="India-first, not India-only"
        title="Built where WhatsApp is how business already happens."
        subtitle="The product UI is English-first today — Hindi/Hinglish is where the AI writer meets you, not a full UI translation yet."
        align="center"
      />
      <div className="mt-14 grid gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
        {POINTS.map(({ icon: Icon, title, body }) => (
          <div key={title} className="text-center">
            <span className="mx-auto flex size-11 items-center justify-center rounded-xl bg-card text-primary ring-1 ring-border">
              <Icon className="size-5" />
            </span>
            <h3 className="mt-4 text-[15px] font-semibold text-foreground">{title}</h3>
            <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
              {body}
            </p>
          </div>
        ))}
      </div>
    </Section>
  );
}

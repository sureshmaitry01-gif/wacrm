import { Lock, ShieldCheck, KeySquare, EyeOff, UsersRound, Bot } from 'lucide-react';

import { Section, SectionHeader } from './section';

const ITEMS = [
  {
    icon: Lock,
    title: 'Your data stays yours',
    body: 'Every account’s data is isolated at the database level — one team can never see another team’s contacts, conversations, or campaigns.',
  },
  {
    icon: ShieldCheck,
    title: 'Signed webhook verification',
    body: 'Inbound events from WhatsApp and our payment provider are cryptographically verified before anything is trusted or applied.',
  },
  {
    icon: KeySquare,
    title: 'Secrets never touch the client',
    body: 'API keys and provider credentials are handled server-side only — never shipped to the browser, never logged.',
  },
  {
    icon: UsersRound,
    title: 'Role-based team access',
    body: 'Owner, admin, agent, and viewer roles control who can change settings versus who can just work the inbox.',
  },
  {
    icon: Bot,
    title: 'No automatic AI sending',
    body: 'AI drafts messages for you to review. It does not send campaigns or replies on its own.',
  },
  {
    icon: EyeOff,
    title: 'PII-conscious by default',
    body: 'Operational logs and audit records are built to avoid capturing customer message content unnecessarily.',
  },
];

export function Security() {
  return (
    <Section>
      <SectionHeader
        eyebrow="Security & trust"
        title="Built with tenant isolation from day one."
        align="center"
      />
      <div className="mt-14 grid gap-x-8 gap-y-9 sm:grid-cols-2 lg:grid-cols-3">
        {ITEMS.map(({ icon: Icon, title, body }) => (
          <div key={title} className="flex gap-3.5">
            <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-lg bg-card-2 text-primary ring-1 ring-border">
              <Icon className="size-4.5" />
            </span>
            <div>
              <h3 className="text-sm font-semibold text-foreground">{title}</h3>
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                {body}
              </p>
            </div>
          </div>
        ))}
      </div>
    </Section>
  );
}

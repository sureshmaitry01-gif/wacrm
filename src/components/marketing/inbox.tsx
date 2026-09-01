import { CheckCheck, UserRoundCheck, History, MessagesSquare } from 'lucide-react';

import { Section, SectionHeader } from './section';

const FEATURES = [
  {
    icon: MessagesSquare,
    title: 'One inbox for the whole team',
    body: 'Every WhatsApp conversation lands in a single shared inbox — no more replying from someone’s personal phone.',
  },
  {
    icon: UserRoundCheck,
    title: 'Assign and resolve',
    body: 'Hand a conversation to the right teammate and mark it resolved once it’s handled, so nothing sits forgotten.',
  },
  {
    icon: History,
    title: 'Full customer context',
    body: 'See the complete message thread and contact details in one place before you reply.',
  },
  {
    icon: CheckCheck,
    title: 'Status at a glance',
    body: 'Open, assigned, and resolved states make it obvious what still needs a response.',
  },
];

export function Inbox() {
  return (
    <Section tone="muted">
      <SectionHeader
        eyebrow="Shared inbox"
        title="Every reply, one place, no dropped conversations."
        subtitle="Built for a team, not a single phone — assignment and resolution status keep replies accountable."
      />
      <div className="mt-12 grid gap-x-8 gap-y-9 sm:grid-cols-2">
        {FEATURES.map(({ icon: Icon, title, body }) => (
          <div key={title} className="flex gap-4">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-card text-primary ring-1 ring-border">
              <Icon className="size-5" />
            </span>
            <div>
              <h3 className="text-[15px] font-semibold text-foreground">{title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                {body}
              </p>
            </div>
          </div>
        ))}
      </div>
    </Section>
  );
}

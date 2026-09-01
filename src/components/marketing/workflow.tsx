import { Section, SectionHeader } from './section';

const STEPS = [
  {
    step: 'Connect WhatsApp',
    body: 'Link your WhatsApp Business number to message customers on the official WhatsApp API.',
  },
  {
    step: 'Add your contacts',
    body: 'Import a CSV or add customers by hand.',
  },
  {
    step: 'Create a template',
    body: 'Write it yourself, or let AI draft it in English, हिंदी, or Hinglish.',
  },
  {
    step: 'Check cost & quality',
    body: 'See the estimated cost in ₹ and a quality score before you commit to anything.',
  },
  {
    step: 'Launch the campaign',
    body: 'Send to everyone, a tag, or a CSV list — you choose the audience.',
  },
  {
    step: 'Work replies together',
    body: 'Every response lands in one shared inbox your team can assign and resolve.',
  },
];

export function Workflow() {
  return (
    <Section id="product">
      <SectionHeader
        eyebrow="Product proof"
        title="One flow, from first message to last reply."
        subtitle="This is the actual sequence in the app today — not a simplified diagram of a bigger roadmap."
      />

      <ol className="relative mt-14 grid gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
        <div
          aria-hidden
          className="absolute inset-x-0 top-4 hidden h-px bg-border lg:block"
        />
        {STEPS.map((s, i) => (
          <li key={s.step} className="relative">
            <div className="flex items-center gap-3">
              <span className="relative z-10 flex size-8 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
                {i + 1}
              </span>
              <h3 className="text-[15px] font-semibold text-foreground">
                {s.step}
              </h3>
            </div>
            <p className="mt-2.5 pl-11 text-sm leading-relaxed text-muted-foreground">
              {s.body}
            </p>
          </li>
        ))}
      </ol>
    </Section>
  );
}

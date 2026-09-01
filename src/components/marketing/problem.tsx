import { Section, SectionHeader } from './section';

const PAINS = [
  {
    title: 'Campaigns live in spreadsheets and personal phones',
    body: 'Contact lists get copied between sheets, messages get sent from someone’s personal WhatsApp, and nobody can say what actually went out last week.',
  },
  {
    title: 'The shared inbox turns into chaos',
    body: 'Multiple team members reply from the same number with no record of who answered what, or whether a customer is still waiting.',
  },
  {
    title: 'Pricing is opaque until the bill arrives',
    body: 'Meta bills per message by category, with rates that change by country and volume. Most teams find out what a campaign cost after it’s sent.',
  },
  {
    title: 'Message quality and approval risk are a guess',
    body: 'Marketing templates go through Meta review. Spammy phrasing, ALL-CAPS, or missing a call to action can mean rejection — usually discovered too late.',
  },
];

export function Problem() {
  return (
    <Section tone="muted">
      <SectionHeader
        eyebrow="Why this exists"
        title="Small business WhatsApp outgrows spreadsheets fast."
        subtitle="Once more than one person is messaging customers, the informal way of running WhatsApp stops working."
      />
      <div className="mt-12 grid gap-x-10 gap-y-10 sm:grid-cols-2">
        {PAINS.map((pain, i) => (
          <div key={pain.title} className="flex gap-4">
            <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-card text-sm font-medium text-muted-foreground ring-1 ring-border [font-family:var(--font-display)]">
              {String(i + 1).padStart(2, '0')}
            </span>
            <div>
              <h3 className="text-[15px] font-semibold text-foreground">
                {pain.title}
              </h3>
              <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                {pain.body}
              </p>
            </div>
          </div>
        ))}
      </div>
    </Section>
  );
}

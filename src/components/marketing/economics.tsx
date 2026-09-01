import { Section, SectionHeader } from './section';

const PRINCIPLES = [
  {
    title: 'No hidden platform markup',
    body: 'Your platform fee is a flat monthly plan price. Meta’s per-message cost is shown as its own line — we don’t add a markup on top of it.',
  },
  {
    title: 'Assumptions shown, not buried',
    body: 'Every estimate states its category, the delivery assumption used, and where the rate came from — not just a single confident-looking number.',
  },
  {
    title: 'Conservative by design',
    body: 'The estimator prices every message as billable and skips volume discounts, so real bills tend to come in at or under the estimate, not over it.',
  },
  {
    title: 'Rates can change — we say so',
    body: 'WhatsApp messaging rates are set by Meta and change over time. Estimates carry a clear caveat rather than pretending to be a locked-in quote.',
  },
];

export function Economics() {
  return (
    <Section>
      <SectionHeader
        eyebrow="Transparent economics"
        title="Estimate campaign costs before sending — with the math shown."
        subtitle="This is one of the things we care about most: no surprise bill, no guessing what a campaign will cost."
      />
      <div className="mt-12 grid gap-x-10 gap-y-9 sm:grid-cols-2">
        {PRINCIPLES.map((p) => (
          <div
            key={p.title}
            className="rounded-xl border border-border bg-card p-5 shadow-card"
          >
            <h3 className="text-[15px] font-semibold text-foreground">{p.title}</h3>
            <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
              {p.body}
            </p>
          </div>
        ))}
      </div>
    </Section>
  );
}

import { cn } from '@/lib/utils';
import { Band, Inner, SectionHead } from './section';
import { Reveal } from './reveal';

// Deliberately not numbered: these are four independent failure modes,
// not a sequence. The mono label names the *category* of failure, which
// is information; an 01/02/03 here would only be decoration. (The
// workflow section, which really is ordered, does get numbers.)
const PAINS = [
  {
    label: 'Record',
    title: 'Campaigns live in spreadsheets and personal phones',
    body: 'Contact lists get copied between sheets, messages go out from someone’s personal WhatsApp, and nobody can say what actually shipped last week.',
  },
  {
    label: 'Accountability',
    title: 'The shared number has no shared memory',
    body: 'Several people reply from the same number with no record of who answered what, or whether a customer is still waiting on someone.',
  },
  {
    label: 'Cost',
    title: 'Pricing is opaque until the bill arrives',
    body: 'Meta bills per message by category, at rates that change by country and volume. Most teams learn what a campaign cost after it was sent.',
  },
  {
    label: 'Approval',
    title: 'Template rejection is discovered too late',
    body: 'Marketing templates go through Meta review. Spammy phrasing, ALL-CAPS, or a missing call to action can mean rejection — usually found out at the worst moment.',
  },
];

export function Problem() {
  return (
    <Band tone="raised">
      <Inner>
        <SectionHead
          eyebrow="Why this exists"
          title="Small business WhatsApp outgrows spreadsheets fast."
          lede="Once more than one person is messaging customers, the informal way of running WhatsApp quietly stops working."
        />

        <div className="mt-14 grid border-t border-border sm:mt-16 sm:grid-cols-2">
          {PAINS.map((pain, i) => (
            <Reveal
              key={pain.title}
              delay={i * 70}
              className={cn(
                'border-b border-border py-8 sm:px-8 sm:py-10',
                i % 2 === 0 && 'sm:border-r sm:pl-0',
                i % 2 === 1 && 'sm:pr-0',
                i >= 2 && 'sm:border-b-0',
              )}
            >
              <p className="text-[10.5px] tracking-[0.16em] text-muted-foreground uppercase [font-family:var(--font-plex)]">
                {pain.label}
              </p>
              <h3 className="mt-3 max-w-[24ch] text-[1.0625rem] leading-snug font-medium tracking-[-0.01em] text-foreground">
                {pain.title}
              </h3>
              <p className="mt-2.5 max-w-[46ch] text-[13.5px] leading-[1.65] text-muted-foreground">
                {pain.body}
              </p>
            </Reveal>
          ))}
        </div>
      </Inner>
    </Band>
  );
}

import { Band, Cell, GridFrame, Inner, SectionHead } from './section';
import { Reveal } from './reveal';

/** The WhatsApp delivered receipt — the double tick. Drawn rather than
 *  borrowed: no Meta mark appears anywhere on this site. */
function DoubleTick() {
  return (
    <svg
      viewBox="0 0 44 24"
      aria-hidden="true"
      className="h-[1em] w-auto"
      fill="none"
      stroke="var(--signal)"
      strokeWidth="2.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 13.5 9.5 20 24 4" />
      <path d="M19 13.5 25.5 20 40 4" />
    </svg>
  );
}

const POINTS: { glyph: React.ReactNode; label: string; body: string }[] = [
  {
    glyph: '₹',
    label: 'Priced in rupees',
    body: 'Plans are INR-first, sized around what a small Indian business actually spends in a month.',
  },
  {
    glyph: 'अ',
    label: 'Drafts in हिंदी',
    body: 'The AI writer composes in Devanagari, not a transliteration of an English message.',
  },
  {
    glyph: (
      <span className="whitespace-nowrap">
        A<span className="text-muted-foreground">+</span>अ
      </span>
    ),
    label: 'And in Hinglish',
    body: 'Because that is how most sellers and customers actually message each other.',
  },
  {
    glyph: <DoubleTick />,
    label: 'WhatsApp is the channel',
    body: 'Campaigns, inbox and templates are built on the WhatsApp Business API — not one integration among many.',
  },
];

export function IndiaFirst() {
  return (
    <Band tone="mint">
      <Inner>
        <SectionHead
          align="center"
          eyebrow="India-first, not India-only"
          title="Built where WhatsApp is already how business happens."
        />

        <Reveal delay={120} className="mt-14 sm:mt-16">
          <GridFrame className="sm:grid-cols-2 lg:grid-cols-4">
            {POINTS.map((p) => (
              <Cell key={p.label} className="flex flex-col">
                <span className="flex h-16 items-center text-[clamp(2.5rem,4.4vw,3.25rem)] leading-none font-medium tracking-[-0.02em] text-foreground [font-family:var(--font-display)]">
                  {p.glyph}
                </span>
                <h3 className="mt-6 text-[14px] font-medium text-foreground">{p.label}</h3>
                <p className="mt-2 text-[13px] leading-[1.65] text-muted-foreground">{p.body}</p>
              </Cell>
            ))}
          </GridFrame>
        </Reveal>

        <Reveal delay={60}>
          <p className="mx-auto mt-8 max-w-[52ch] text-center text-[12.5px] leading-relaxed text-muted-foreground">
            The product interface itself is English-first today. Hindi and
            Hinglish are where the AI writer meets you — not a full UI
            translation yet.
          </p>
        </Reveal>
      </Inner>
    </Band>
  );
}

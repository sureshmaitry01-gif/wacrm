import { Band, Inner, Eyebrow, Heading, Lede } from './section';
import { CostEquation } from './cost-math';
import { Reveal } from './reveal';

const PRINCIPLES = [
  {
    label: 'No markup',
    body: 'Your plan fee is the platform. Meta’s per-message cost is its own line, and we do not add anything on top of it.',
  },
  {
    label: 'Assumptions shown',
    body: 'Every estimate states its category, the delivery assumption used, and where the rate came from.',
  },
  {
    label: 'Deliberately conservative',
    body: 'Every message is priced as billable and no volume discount is assumed, so real bills tend to land at or under the estimate.',
  },
  {
    label: 'Rates move',
    body: 'WhatsApp messaging rates are set by Meta and change over time. An estimate is an estimate, not a locked quote.',
  },
];

export function Economics() {
  return (
    <Band>
      <Inner>
        <Reveal className="max-w-[46rem]">
          <Eyebrow>Transparent economics</Eyebrow>
          <Heading className="mt-5">
            The estimate is an equation, not a number to trust.
          </Heading>
          <Lede className="mt-5">
            Campaign cost is the one thing teams find out too late. So the app
            shows the whole calculation — the audience you chose, the rate it
            used, and the assumption behind it — before anything sends.
          </Lede>
        </Reveal>

        {/* The page's signature moment. */}
        <Reveal delay={140} className="mt-14 sm:mt-16">
          <CostEquation />
          <p className="mt-5 text-[12.5px] text-muted-foreground [font-family:var(--font-plex)]">
            Figures illustrative · See the assumptions behind the estimate on the
            review step
          </p>
        </Reveal>

        <Reveal delay={80} className="mt-16 grid gap-x-10 gap-y-8 sm:grid-cols-2 lg:grid-cols-4">
          {PRINCIPLES.map((p) => (
            <div key={p.label}>
              <p className="text-[10.5px] tracking-[0.16em] text-muted-foreground uppercase [font-family:var(--font-plex)]">
                {p.label}
              </p>
              <p className="mt-3 max-w-[34ch] text-[13px] leading-[1.65] text-foreground">
                {p.body}
              </p>
            </div>
          ))}
        </Reveal>
      </Inner>
    </Band>
  );
}

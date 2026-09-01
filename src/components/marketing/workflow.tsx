import { Band, Inner, SectionHead } from './section';
import { Symbol, type SymbolName } from './symbols';
import { Reveal } from './reveal';

// This one IS ordered — it is the actual sequence in the app today — so
// it is the one place on the page that earns numbered markers.
const STEPS: { symbol: SymbolName; step: string; body: string }[] = [
  {
    symbol: 'connect',
    step: 'Connect WhatsApp',
    body: 'Link your WhatsApp Business number and message on the official API.',
  },
  {
    symbol: 'contacts',
    step: 'Add your contacts',
    body: 'Import a CSV or add customers by hand, then tag them.',
  },
  {
    symbol: 'template',
    step: 'Create a template',
    body: 'Write it yourself, or let AI draft it in English, हिंदी or Hinglish.',
  },
  {
    symbol: 'economics',
    step: 'Check cost & quality',
    body: 'See the estimated ₹ cost and a quality score before committing.',
  },
  {
    symbol: 'campaign',
    step: 'Launch the campaign',
    body: 'Send to everyone, a tag, a custom field, or an uploaded list.',
  },
  {
    symbol: 'inbox',
    step: 'Work the replies',
    body: 'Every response lands in one shared inbox to assign and resolve.',
  },
];

export function Workflow() {
  return (
    <Band id="product">
      <Inner>
        <SectionHead
          eyebrow="How it works"
          title="One flow, from first message to last reply."
          lede="This is the sequence in the product today — not a simplified diagram of a longer roadmap."
        />

        <Reveal className="relative mt-14 sm:mt-20">
          {/* The rail extends itself once as the section arrives.
              Horizontal at lg, where the six steps sit in one row and
              the line runs centre-to-centre through the symbols; and
              vertical only below sm, where they stack in a single
              column. In between the layout is a two-column grid, which
              a single rail cannot honestly connect — so there is none. */}
          <span
            aria-hidden
            className="m-connector absolute top-6 right-6 left-6 hidden h-px bg-border lg:block"
          />
          <span
            aria-hidden
            className="m-connector-v absolute top-6 bottom-6 left-[23px] w-px bg-border sm:hidden"
          />

          <ol className="relative grid gap-x-6 gap-y-9 sm:grid-cols-2 lg:grid-cols-6 lg:gap-x-5">
            {STEPS.map((s, i) => (
              <li key={s.step} className="group/sym flex gap-4 lg:block">
                <span className="flex size-12 shrink-0 items-center justify-center rounded-full border border-border bg-background text-muted-foreground transition-colors duration-300 group-hover/sym:border-primary/40 group-hover/sym:text-primary">
                  <Symbol name={s.symbol} className="size-6" />
                </span>
                <div className="lg:mt-5">
                  <p className="text-[10.5px] tracking-[0.16em] text-muted-foreground uppercase [font-family:var(--font-plex)]">
                    Step {String(i + 1).padStart(2, '0')}
                  </p>
                  <h3 className="mt-1.5 text-[14.5px] leading-snug font-medium text-foreground">
                    {s.step}
                  </h3>
                  <p className="mt-2 max-w-[34ch] text-[13px] leading-[1.6] text-muted-foreground">
                    {s.body}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </Reveal>
      </Inner>
    </Band>
  );
}

import { Band, Cell, CellLabel, GridFrame, Inner, SectionHead } from './section';
import { Reveal } from './reveal';

const AUDIENCE_SOURCES = ['Everyone', 'Tag', 'Custom field', 'CSV list'];

export function Campaigns() {
  return (
    <Band id="features">
      <Inner>
        <SectionHead
          eyebrow="Campaigns"
          title="Know the cost and the risk before you commit."
          lede="A four-step wizard — template, audience, personalisation, review. Nothing sends until the last step, and the last step shows you the arithmetic."
        />

        {/* A structured bento: one large composer cell with the review
            panels ruled off around it. Cells vary in size but share one
            hairline grid, so they read as one screen rather than as a
            set of independent widgets. */}
        <Reveal delay={120} className="mt-14 sm:mt-16">
          <GridFrame className="lg:grid-cols-3">
            {/* Composer — the large cell */}
            <Cell className="lg:col-span-2 lg:row-span-2">
              <div className="flex items-center justify-between gap-3">
                <CellLabel>Message</CellLabel>
                <span className="rounded bg-primary-soft px-2 py-0.5 text-[10.5px] text-primary [font-family:var(--font-plex)]">
                  Marketing
                </span>
              </div>

              <div className="mt-5 max-w-[46ch] rounded-lg rounded-tl-sm bg-card-2 p-4 text-[13.5px] leading-[1.7] text-foreground ring-1 ring-border">
                Hi{' '}
                <span className="rounded bg-mint-strong/70 px-1 py-0.5 text-[12.5px] [font-family:var(--font-plex)]">
                  {'{{1}}'}
                </span>
                , our Diwali collection is 20% off until Sunday. Reply{' '}
                <strong className="font-medium">SHOP</strong> and we’ll hold your
                order at the counter. 🪔
                <br />
                <span className="text-muted-foreground">
                  Reply STOP to opt out of offers.
                </span>
              </div>

              <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-[11px] text-muted-foreground [font-family:var(--font-plex)]">
                <span>168 / 1024 characters</span>
                <span>1 variable</span>
                <span className="flex items-center gap-1.5">
                  <span aria-hidden className="size-1.5 rounded-full bg-signal" />
                  Opt-out line present
                </span>
              </div>
            </Cell>

            {/* Cost */}
            <Cell tone="mint">
              <CellLabel>Estimated cost</CellLabel>
              <p className="mt-3 text-[2rem] leading-none font-medium tracking-[-0.03em] text-foreground [font-family:var(--font-display)]">
                ~₹3,625
              </p>
              <p className="mt-3 text-[11.5px] text-muted-foreground [font-family:var(--font-plex)]">
                4,200 × ₹0.8630 / delivered
              </p>
              <p className="mt-3 text-[11.5px] leading-relaxed text-muted-foreground">
                Priced from the configured rate card for this category. Meta sets
                these rates and can change them.
              </p>
            </Cell>

            {/* Quality */}
            <Cell>
              <div className="flex items-baseline justify-between gap-3">
                <CellLabel>Quality score</CellLabel>
                <span className="text-[13px] font-medium text-primary [font-family:var(--font-plex)]">
                  B · 82
                </span>
              </div>
              <div
                aria-hidden
                className="mt-4 h-1 w-full overflow-hidden rounded-full bg-border"
              >
                <span className="block h-full w-[82%] rounded-full bg-primary" />
              </div>
              <ul className="mt-4 space-y-2 text-[12px] leading-relaxed text-muted-foreground">
                <li className="flex gap-2">
                  <span aria-hidden className="mt-1.5 size-1.5 shrink-0 rounded-full bg-signal" />
                  Clear call to action detected
                </li>
                <li className="flex gap-2">
                  <span aria-hidden className="mt-1.5 size-1.5 shrink-0 rounded-full bg-border" />
                  Consider shortening the second sentence
                </li>
              </ul>
            </Cell>

            {/* Audience */}
            <Cell>
              <CellLabel>Audience</CellLabel>
              <p className="mt-3 text-[1.375rem] leading-none font-medium tracking-[-0.02em] text-foreground [font-family:var(--font-display)]">
                4,200 recipients
              </p>
              <div className="mt-4 flex flex-wrap gap-1.5">
                {AUDIENCE_SOURCES.map((s, i) => (
                  <span
                    key={s}
                    className={
                      i === 1
                        ? 'rounded border border-primary/30 bg-primary-soft px-2 py-1 text-[10.5px] text-primary'
                        : 'rounded border border-border px-2 py-1 text-[10.5px] text-muted-foreground'
                    }
                  >
                    {s}
                  </span>
                ))}
              </div>
            </Cell>

            {/* Template state */}
            <Cell>
              <CellLabel>Template</CellLabel>
              <p className="mt-3 text-[14px] font-medium text-foreground">Diwali offer</p>
              <p className="mt-1.5 flex items-center gap-1.5 text-[12px] text-muted-foreground">
                <span aria-hidden className="size-1.5 rounded-full bg-signal" />
                Approved — Marketing category
              </p>
              <p className="mt-4 text-[11.5px] leading-relaxed text-muted-foreground">
                Meta reviews every template. Status stays visible here while it
                is pending.
              </p>
            </Cell>

            {/* Terminal actions */}
            <Cell tone="raised">
              <CellLabel>Then</CellLabel>
              <ul className="mt-3.5 space-y-2.5 text-[13px] text-foreground">
                <li>Save as a draft to finish later</li>
                <li>Send now, once the review looks right</li>
              </ul>
              <p className="mt-4 text-[11.5px] leading-relaxed text-muted-foreground">
                Nothing leaves this screen without an explicit send.
              </p>
            </Cell>
          </GridFrame>

          <p className="mt-4 text-xs leading-relaxed text-muted-foreground [font-family:var(--font-plex)]">
            Illustrative figures. Actuals depend on your audience, template and
            the configured rate card.
          </p>
        </Reveal>
      </Inner>
    </Band>
  );
}

import { Band, Inner, Eyebrow, Heading, Lede } from './section';
import { AppFrame } from './browser-frame';
import { Symbol } from './symbols';
import { Reveal } from './reveal';

const CAPABILITIES = [
  'Writes in English, हिंदी and Hinglish — however your customers actually message you.',
  'Drafts a new message, or rewrites an existing one into a shorter variant.',
  'Suggests calls to action and flags phrasing that can affect Meta template approval.',
  'Never sends. The draft lands in the campaign for you to edit and approve.',
];

const LANGUAGES = ['English', 'हिंदी', 'Hinglish'];

export function AIWriter() {
  return (
    <Band tone="raised">
      <Inner>
        <div className="grid gap-y-12 lg:grid-cols-12 lg:items-center lg:gap-x-16">
          <div className="lg:col-span-5">
            <Reveal className="group/sym">
              <span className="flex size-12 items-center justify-center rounded-lg border border-border bg-background text-ai">
                <Symbol name="ai" className="size-7" />
              </span>
              <Eyebrow tone="ai" className="mt-6">
                AI campaign writer
              </Eyebrow>
              <Heading className="mt-5">A drafting partner, not an autopilot.</Heading>
              <Lede className="mt-5">
                Describe the business, the audience and the offer. You get a
                message you can edit, a shorter variant, and call-to-action
                options — in the language your customers actually use.
              </Lede>
            </Reveal>

            <Reveal delay={110}>
              <ul className="mt-9 border-t border-border">
                {CAPABILITIES.map((c) => (
                  <li
                    key={c}
                    className="border-b border-border py-3.5 text-[13.5px] leading-[1.6] text-foreground"
                  >
                    {c}
                  </li>
                ))}
              </ul>
            </Reveal>
          </div>

          {/* The transformation, shown as a ladder rather than an animated
              cycler: the reader can compare the steps instead of waiting
              for them. */}
          <Reveal variant="frame" delay={160} className="lg:col-span-7">
            <AppFrame title="wacrm / campaigns — AI writer">
              <div className="flex gap-1 border-b border-border bg-card-2 px-4 py-2.5">
                {LANGUAGES.map((lang, i) => (
                  <span
                    key={lang}
                    className={
                      i === 2
                        ? 'rounded bg-ai px-2.5 py-1 text-[11px] text-ai-foreground'
                        : 'rounded px-2.5 py-1 text-[11px] text-muted-foreground'
                    }
                  >
                    {lang}
                  </span>
                ))}
              </div>

              <div className="space-y-0 p-5">
                <Step label="Your brief">
                  <span className="text-muted-foreground">
                    Bakery in Pune · Diwali offer, 20% off · ends Sunday · want
                    replies, not just views
                  </span>
                </Step>

                <Step label="Draft">
                  Diwali special chal raha hai!{' '}
                  <span className="rounded bg-mint-strong/70 px-1 py-0.5 text-[12.5px] [font-family:var(--font-plex)]">
                    {'{{1}}'}
                  </span>
                  , aapke liye 20% off on our festive collection — sirf is
                  weekend. Reply <strong className="font-medium">SHOP</strong>{' '}
                  karke order karein. 🪔
                </Step>

                <Step label="Suggested calls to action" last>
                  <span className="flex flex-wrap gap-1.5">
                    {['Reply SHOP', 'Visit store', 'Claim offer'].map((cta) => (
                      <span
                        key={cta}
                        className="rounded border border-border px-2 py-1 text-[11px] text-muted-foreground"
                      >
                        {cta}
                      </span>
                    ))}
                  </span>
                </Step>
              </div>

              <div className="flex items-center justify-between gap-3 border-t border-border bg-card-2 px-5 py-3">
                <p className="text-[11px] text-muted-foreground">
                  Review before it goes anywhere near a campaign.
                </p>
                <span className="shrink-0 rounded bg-foreground px-2.5 py-1.5 text-[11px] text-background">
                  Use this draft
                </span>
              </div>
            </AppFrame>
          </Reveal>
        </div>
      </Inner>
    </Band>
  );
}

/** One rung of the transformation ladder, joined to the next by a rule. */
function Step({
  label,
  children,
  last,
}: {
  label: string;
  children: React.ReactNode;
  last?: boolean;
}) {
  return (
    <div className={last ? '' : 'pb-5'}>
      <p className="text-[10px] tracking-[0.16em] text-muted-foreground uppercase [font-family:var(--font-plex)]">
        {label}
      </p>
      <div className="mt-2.5 text-[13.5px] leading-[1.7] text-foreground">{children}</div>
      {!last ? (
        <span aria-hidden className="mt-5 block h-px w-full bg-border" />
      ) : null}
    </div>
  );
}

import { CircleCheck, TriangleAlert } from 'lucide-react';

import { Section, SectionHeader } from './section';
import { BrowserFrame } from './browser-frame';

const FEATURES = [
  {
    title: 'Four-step campaign wizard',
    body: 'Choose a template, pick the audience (everyone, a tag, a custom field, or a CSV list), personalize the variables, then review before sending.',
  },
  {
    title: 'Cost estimate before you send',
    body: 'See the estimated ₹ cost per message and in total, built from the currently configured Meta rate card and your chosen delivery assumptions.',
  },
  {
    title: 'Quality score on every message',
    body: 'A deterministic 0–100 score checks length, spam-trigger phrasing, ALL-CAPS, emoji overload, missing calls to action, and other things that raise Meta rejection or spam risk.',
  },
  {
    title: 'Draft, schedule, or send now',
    body: 'Save a draft to finish later, or send immediately once you’re happy with the review.',
  },
];

export function Campaigns() {
  return (
    <Section id="features">
      <div className="grid gap-14 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
        <div>
          <SectionHeader
            eyebrow="Campaigns"
            title="Know the cost and the risk before you commit."
          />
          <dl className="mt-10 space-y-7">
            {FEATURES.map((f) => (
              <div key={f.title}>
                <dt className="text-[15px] font-semibold text-foreground">
                  {f.title}
                </dt>
                <dd className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                  {f.body}
                </dd>
              </div>
            ))}
          </dl>
        </div>

        <div>
          <BrowserFrame title="New campaign — Review & send">
            <div className="space-y-4 p-5 text-sm">
              <div className="flex items-center justify-between">
                <span className="font-medium text-foreground">Diwali offer — Marketing</span>
                <span className="rounded-full bg-primary-soft px-2 py-0.5 text-xs font-medium text-primary">
                  4,200 recipients
                </span>
              </div>

              <div className="rounded-lg border border-border bg-card-2 p-3.5">
                <p className="text-xs text-muted-foreground">Estimated cost</p>
                <p className="mt-1 text-xl font-semibold text-foreground">
                  ~₹3,625
                  <span className="ml-1.5 text-xs font-normal text-muted-foreground">
                    (~₹0.86 / recipient)
                  </span>
                </p>
                <p className="mt-1.5 flex items-center gap-1.5 text-xs text-muted-foreground">
                  <TriangleAlert className="size-3.5 shrink-0" />
                  Estimate only — bills per delivered message, actuals may
                  differ
                </p>
              </div>

              <div className="rounded-lg border border-border p-3.5">
                <div className="flex items-center justify-between">
                  <p className="text-xs text-muted-foreground">Quality score</p>
                  <span className="text-xs font-semibold text-primary">B · 82/100</span>
                </div>
                <ul className="mt-2.5 space-y-1.5 text-xs text-muted-foreground">
                  <li className="flex items-center gap-1.5">
                    <CircleCheck className="size-3.5 shrink-0 text-primary" />
                    Clear call to action detected
                  </li>
                  <li className="flex items-center gap-1.5">
                    <TriangleAlert className="size-3.5 shrink-0 text-amber-500" />
                    Consider an opt-out line for marketing sends
                  </li>
                </ul>
              </div>
            </div>
          </BrowserFrame>
          <p className="mt-3 text-xs text-muted-foreground">
            Illustrative example. Actual figures depend on your audience,
            template, and the currently configured rate card.
          </p>
        </div>
      </div>
    </Section>
  );
}

import { Sparkles, Languages, PenLine, ShieldCheck } from 'lucide-react';

import { Section } from './section';
import { BrowserFrame } from './browser-frame';
import { Badge } from '@/components/ui/badge';

const CAPABILITIES = [
  {
    icon: Languages,
    text: 'Writes in English, हिंदी, and Hinglish — however your customers actually message you back.',
  },
  {
    icon: PenLine,
    text: 'Drafts a new message, or rewrites and tightens an existing one into a shorter version.',
  },
  {
    icon: Sparkles,
    text: 'Suggests calls to action and flags anything that could affect Meta template approval.',
  },
  {
    icon: ShieldCheck,
    text: 'AI helps draft. You decide what gets sent — nothing goes out without your review.',
  },
];

export function AIWriter() {
  return (
    <Section tone="ai">
      <div className="grid gap-14 lg:grid-cols-[1fr_1fr] lg:items-center">
        <div>
          <Badge className="bg-ai text-ai-foreground">AI campaign writer</Badge>
          <h2 className="mt-5 text-[clamp(1.75rem,3.4vw,2.5rem)] leading-[1.1] font-medium tracking-tight text-foreground [font-family:var(--font-display)]">
            A drafting partner, not an autopilot.
          </h2>
          <p className="mt-4 max-w-lg text-base leading-relaxed text-muted-foreground sm:text-lg">
            Describe your business, audience, and offer — get a ready-to-edit
            draft with a shorter variant and CTA ideas, in the language your
            customers actually use.
          </p>
          <ul className="mt-8 space-y-4">
            {CAPABILITIES.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-start gap-3">
                <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-lg bg-ai-soft text-ai">
                  <Icon className="size-4" />
                </span>
                <span className="text-sm leading-relaxed text-foreground">{text}</span>
              </li>
            ))}
          </ul>
        </div>

        <BrowserFrame title="AI campaign writer — Hinglish">
          <div className="space-y-3 p-5 text-sm">
            <div className="flex flex-wrap gap-1.5">
              {['English', 'हिंदी', 'Hinglish'].map((lang, i) => (
                <span
                  key={lang}
                  className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                    i === 2
                      ? 'bg-ai text-ai-foreground'
                      : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {lang}
                </span>
              ))}
            </div>
            <div className="rounded-lg border border-border bg-card-2 p-3.5 leading-relaxed text-foreground">
              Diwali special chal raha hai! {'{{1}}'}, aapke liye 20% off on
              our festive collection — sirf is weekend. Reply SHOP karke
              order karein. 🪔
            </div>
            <div className="flex flex-wrap gap-1.5">
              {['Reply SHOP', 'Visit store', 'Claim offer'].map((cta) => (
                <span
                  key={cta}
                  className="rounded-md border border-border px-2 py-1 text-xs text-muted-foreground"
                >
                  {cta}
                </span>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">
              Compliance note: consider an opt-out line for marketing sends.
            </p>
          </div>
        </BrowserFrame>
      </div>
    </Section>
  );
}

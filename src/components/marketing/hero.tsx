import Link from 'next/link';
import { ArrowRight, CircleCheck } from 'lucide-react';

import { buttonVariants } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { BrowserFrame } from './browser-frame';

const PROOF_POINTS = [
  'Shared team inbox',
  'AI drafts in English, हिंदी & Hinglish',
  'Cost estimate before you send',
];

export function Hero() {
  return (
    <div className="relative overflow-hidden">
      {/* Restrained radial wash, not a purple-gradient hero. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 -top-24 h-[520px] bg-[radial-gradient(60%_60%_at_50%_0%,var(--primary-soft),transparent_70%)]"
      />
      <div className="relative mx-auto grid max-w-6xl gap-14 px-6 pt-16 pb-20 sm:pt-24 sm:pb-28 lg:grid-cols-[1.05fr_1fr] lg:items-center lg:gap-10">
        <div className="lg:pr-6">
          <Badge
            variant="outline"
            className="border-primary/25 bg-primary-soft text-primary"
          >
            Built for WhatsApp-first businesses in India
          </Badge>

          <h1 className="mt-6 text-[clamp(2.25rem,5vw,3.5rem)] leading-[1.05] font-medium tracking-tight text-foreground [font-family:var(--font-display)]">
            Run WhatsApp campaigns without losing control of the conversation.
          </h1>

          <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted-foreground">
            Send and manage WhatsApp campaigns, work every reply from one
            shared team inbox, and see what a campaign will cost before it
            goes out — with AI to help write the message, not send it for
            you.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
            <Link
              href="/signup"
              className={buttonVariants({
                size: 'lg',
                className: 'h-11 px-6 text-[15px]',
              })}
            >
              Start free
              <ArrowRight className="size-4" />
            </Link>
            <a
              href="#product"
              className={buttonVariants({
                variant: 'outline',
                size: 'lg',
                className: 'h-11 px-6 text-[15px]',
              })}
            >
              See how it works
            </a>
          </div>

          <ul className="mt-9 flex flex-col gap-2.5 text-sm text-muted-foreground sm:flex-row sm:flex-wrap sm:gap-x-6 sm:gap-y-2">
            {PROOF_POINTS.map((point) => (
              <li key={point} className="flex items-center gap-2">
                <CircleCheck className="size-4 shrink-0 text-primary" />
                {point}
              </li>
            ))}
          </ul>
        </div>

        {/* Asymmetric visual: offset up/right of the grid cell so it breaks
            the centered-hero pattern rather than sitting in a bento tile.
            Extra bottom/left padding on this wrapper (not on the frame
            itself) reserves room for the floating cost card so it sits in
            genuine whitespace instead of overlapping the mockup's own
            content — the frame's box never shrinks to make room for it. */}
        <div className="lg:translate-y-4">
          <BrowserFrame title="Shared inbox — Priya's Kitchen">
            <div className="grid grid-cols-[minmax(0,120px)_1fr] divide-x divide-border text-xs sm:grid-cols-[140px_1fr]">
              <div className="space-y-1 p-2">
                {[
                  { name: 'Ananya Rao', preview: 'Is this in stock?', unread: true },
                  { name: 'Rahul Mehta', preview: 'Thank you 🙏', unread: false },
                  { name: 'Fatima Khan', preview: 'Delivery today?', unread: true },
                ].map((c) => (
                  <div
                    key={c.name}
                    className={`rounded-md px-2 py-2 ${c.unread ? 'bg-primary-soft' : ''}`}
                  >
                    <p className="truncate font-medium text-foreground">{c.name}</p>
                    <p className="truncate text-muted-foreground">{c.preview}</p>
                  </div>
                ))}
              </div>
              <div className="flex flex-col justify-between p-4">
                <div className="space-y-2">
                  <div className="ml-auto max-w-[75%] rounded-2xl rounded-tr-sm bg-primary px-3 py-2 text-primary-foreground">
                    Hi! Yes, the almond croissants are in stock today.
                  </div>
                  <div className="max-w-[75%] rounded-2xl rounded-tl-sm bg-muted px-3 py-2 text-foreground">
                    Perfect, I&apos;ll come by at 5.
                  </div>
                </div>
                <div className="mt-4 flex items-center justify-between rounded-lg border border-border bg-card-2 px-3 py-2">
                  <span className="text-muted-foreground">Assigned to Priya</span>
                  <span className="font-medium text-primary">Open</span>
                </div>
              </div>
            </div>
          </BrowserFrame>

          {/* Normal document flow, not absolutely positioned: a fixed
              negative margin gives a bounded, predictable "tucked corner"
              overlap (independent of the frame's content height) instead
              of risking covering the mockup's own text at some viewport
              widths. */}
          <div className="-mt-5 ml-6 hidden w-48 rounded-xl border border-border bg-card p-3 text-xs leading-tight shadow-[0_16px_40px_-16px_oklch(0_0_0/0.25)] lg:block">
            <p className="text-muted-foreground">Estimated campaign cost</p>
            <p className="mt-1 text-lg font-semibold text-foreground">
              ~₹432 <span className="text-xs font-normal text-muted-foreground">/ 500 sent</span>
            </p>
            <p className="mt-1 text-muted-foreground">Illustrative · assumptions shown before send</p>
          </div>
        </div>
      </div>
    </div>
  );
}

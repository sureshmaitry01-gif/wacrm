import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

import { buttonVariants } from '@/components/ui/button';
import { Band, Eyebrow, Heading, Lede } from './section';
import { AppFrame } from './browser-frame';
import { CostChip } from './cost-math';
import { Reveal } from './reveal';

const CONVERSATIONS = [
  { initials: 'AR', name: 'Ananya Rao', preview: 'Is the almond croissant in stock?', time: '2m', unread: true, active: true },
  { initials: 'RM', name: 'Rahul Mehta', preview: 'Thank you 🙏', time: '18m', unread: false, active: false },
  { initials: 'FK', name: 'Fatima Khan', preview: 'Delivery today?', time: '1h', unread: true, active: false },
  { initials: 'VS', name: 'Vikram Shah', preview: 'Can I change the order?', time: '3h', unread: false, active: false },
];

const CONTEXT_ROWS = [
  { label: 'Tags', value: 'Regular · Diwali-24' },
  { label: 'From campaign', value: 'Diwali offer — Marketing' },
  { label: 'Assignee', value: 'Priya S.' },
];

export function Hero() {
  return (
    <Band>
      <div className="relative overflow-hidden">
        {/* The page's only gradient, and a hairline column grid beneath
            it. Both sit far below text contrast — depth you feel before
            you notice it. */}
        <div aria-hidden className="m-wash pointer-events-none absolute inset-x-0 top-0 h-[640px]" />
        <div
          aria-hidden
          className="m-gridlines pointer-events-none absolute inset-x-0 top-0 h-[640px] [mask-image:linear-gradient(to_bottom,black,transparent)]"
        />

        <div className="relative mx-auto max-w-6xl px-6 pt-16 sm:px-10 sm:pt-24">
          {/* Asymmetric masthead: the claim on the left at display size,
              the explanation and the actions in a narrower column that
              hangs off its baseline. */}
          <div className="grid gap-y-9 lg:grid-cols-12 lg:gap-x-12">
            <Reveal className="lg:col-span-7">
              <Eyebrow>WhatsApp CRM · India-first</Eyebrow>
              <Heading level={1} size="lg" className="mt-6 max-w-[15ch]">
                Run WhatsApp campaigns without losing control of the conversation.
              </Heading>
            </Reveal>

            <Reveal delay={110} className="lg:col-span-5 lg:self-end lg:pb-2">
              <Lede className="max-w-[42ch]">
                Campaigns, a shared team inbox, and a cost estimate before
                anything goes out. AI drafts the message in English, हिंदी or
                Hinglish — you decide what sends.
              </Lede>

              <div className="mt-7 flex flex-wrap items-center gap-x-6 gap-y-3">
                <Link
                  href="/signup"
                  className={buttonVariants({
                    className: 'group/cta h-11 gap-2 px-5 text-[14px]',
                  })}
                >
                  Start free
                  <ArrowRight className="size-4 transition-transform duration-200 group-hover/cta:translate-x-0.5" />
                </Link>
                <a
                  href="#product"
                  className="group/link inline-flex items-center gap-1.5 text-[14px] font-medium text-foreground underline-offset-4 hover:underline"
                >
                  See how it works
                  <ArrowRight className="size-3.5 text-muted-foreground transition-transform duration-200 group-hover/link:translate-x-0.5" />
                </a>
              </div>

              <p className="mt-7 text-[11.5px] leading-relaxed text-muted-foreground [font-family:var(--font-plex)]">
                No card to start · Bring your own WhatsApp Business number
              </p>
            </Reveal>
          </div>
        </div>

        {/* The product is the hero image. One frame, wider than the text
            column, showing the screen the team actually lives in. */}
        <div className="relative mx-auto mt-14 max-w-[1280px] px-6 pb-24 sm:mt-20 sm:px-10 lg:pb-32">
          <Reveal variant="frame" delay={180} className="relative">
            <AppFrame title="wacrm / inbox — Priya's Kitchen">
              <div className="grid divide-border sm:grid-cols-[190px_1fr] sm:divide-x lg:grid-cols-[220px_1fr_236px]">
                {/* Conversation list */}
                <div className="hidden flex-col sm:flex">
                  <div className="flex items-center justify-between border-b border-border px-3.5 py-3">
                    <span className="text-[12px] font-medium text-foreground">Inbox</span>
                    <span className="rounded bg-primary-soft px-1.5 py-0.5 text-[10px] text-primary [font-family:var(--font-plex)]">
                      2 new
                    </span>
                  </div>
                  <div className="flex gap-1 border-b border-border px-3 py-2">
                    {['All', 'Mine', 'Open'].map((f, i) => (
                      <span
                        key={f}
                        className={
                          i === 0
                            ? 'rounded bg-foreground px-2 py-0.5 text-[10px] text-background'
                            : 'rounded px-2 py-0.5 text-[10px] text-muted-foreground'
                        }
                      >
                        {f}
                      </span>
                    ))}
                  </div>
                  {CONVERSATIONS.map((c) => (
                    <div
                      key={c.name}
                      className={`flex items-start gap-2.5 border-b border-border px-3 py-2.5 last:border-b-0 ${c.active ? 'bg-mint' : ''}`}
                    >
                      <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-card-2 text-[10px] font-medium text-muted-foreground ring-1 ring-border">
                        {c.initials}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-baseline justify-between gap-2">
                          <p className="truncate text-[12px] font-medium text-foreground">{c.name}</p>
                          <span className="shrink-0 text-[10px] text-muted-foreground [font-family:var(--font-plex)]">
                            {c.time}
                          </span>
                        </div>
                        <p className="mt-0.5 truncate text-[11px] text-muted-foreground">{c.preview}</p>
                      </div>
                      {c.unread ? (
                        <span aria-hidden className="mt-1.5 size-1.5 shrink-0 rounded-full bg-signal" />
                      ) : null}
                    </div>
                  ))}
                </div>

                {/* Thread */}
                <div className="flex min-h-[340px] flex-col sm:min-h-[400px]">
                  <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
                    <div className="min-w-0">
                      <p className="truncate text-[12.5px] font-medium text-foreground">Ananya Rao</p>
                      <p className="truncate text-[10.5px] text-muted-foreground [font-family:var(--font-plex)]">
                        +91 98••• ••42
                      </p>
                    </div>
                    <span className="flex shrink-0 items-center gap-1.5 rounded border border-border px-2 py-1 text-[10px] text-muted-foreground">
                      <span aria-hidden className="size-1.5 rounded-full bg-signal" />
                      Open
                    </span>
                  </div>

                  <div className="flex flex-1 flex-col justify-end gap-2.5 p-4">
                    <div className="max-w-[78%] rounded-lg rounded-tl-sm bg-card-2 px-3 py-2 text-[12.5px] leading-relaxed text-foreground ring-1 ring-border">
                      Hi! Saw your Diwali message. Is the almond croissant in
                      stock?
                    </div>
                    <div className="ml-auto max-w-[78%] rounded-lg rounded-tr-sm bg-primary px-3 py-2 text-[12.5px] leading-relaxed text-primary-foreground">
                      Yes — fresh batch out at 4pm today. Want me to hold two?
                    </div>
                    <div className="max-w-[78%] rounded-lg rounded-tl-sm bg-card-2 px-3 py-2 text-[12.5px] leading-relaxed text-foreground ring-1 ring-border">
                      Perfect, I&apos;ll come by at 5.
                    </div>
                  </div>

                  <div className="flex items-center gap-2 border-t border-border px-4 py-3">
                    <span className="flex-1 truncate rounded border border-border px-2.5 py-1.5 text-[11.5px] text-muted-foreground">
                      Reply as Priya S.…
                    </span>
                    <span className="rounded bg-foreground px-2.5 py-1.5 text-[11px] text-background">
                      Send
                    </span>
                  </div>
                </div>

                {/* Context panel */}
                <div className="hidden flex-col gap-5 p-4 lg:flex">
                  <div>
                    <p className="text-[10px] tracking-[0.14em] text-muted-foreground uppercase [font-family:var(--font-plex)]">
                      Contact
                    </p>
                    <p className="mt-2 text-[12.5px] font-medium text-foreground">Ananya Rao</p>
                    <p className="mt-0.5 text-[11px] text-muted-foreground">Customer since Mar 2025</p>
                  </div>
                  {CONTEXT_ROWS.map((row) => (
                    <div key={row.label}>
                      <p className="text-[10px] tracking-[0.14em] text-muted-foreground uppercase [font-family:var(--font-plex)]">
                        {row.label}
                      </p>
                      <p className="mt-1.5 text-[11.5px] leading-relaxed text-foreground">{row.value}</p>
                    </div>
                  ))}
                </div>
              </div>
            </AppFrame>

            {/* The estimate straddles the frame's bottom edge — half in
                the product, half in the page. */}
            <CostChip className="absolute bottom-0 left-10 hidden translate-y-1/2 lg:block" />
          </Reveal>
        </div>
      </div>
    </Band>
  );
}

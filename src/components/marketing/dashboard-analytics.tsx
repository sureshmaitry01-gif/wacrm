import type { CSSProperties } from 'react';

import { Band, Inner, SectionHead } from './section';
import { AppFrame, FrameCaption } from './browser-frame';
import { Reveal } from './reveal';

const METRICS = [
  { label: 'Conversations', value: '318', delta: '+12%' },
  { label: 'New contacts', value: '54', delta: '+8%' },
  { label: 'Median response', value: '4m', delta: '−31s' },
  { label: 'Campaigns sent', value: '6', delta: '—' },
];

const EXPLAINERS = [
  {
    title: 'Conversation volume',
    body: 'A daily trend over the last 7, 30 or 90 days, so a quiet week is visible before it becomes a quiet month.',
  },
  {
    title: 'Response time',
    body: 'How quickly your team is actually getting back to people — the number customers feel.',
  },
  {
    title: 'Pipeline breakdown',
    body: 'Where conversations and deals are sitting across your stages right now.',
  },
  {
    title: 'Activity feed',
    body: 'A running log of what changed and who changed it, so nothing gets lost between shifts.',
  },
];

// Illustrative daily conversation counts. Deliberately not a smooth
// upward curve — a real inbox has weekends.
const SERIES = [
  9, 12, 10, 15, 13, 6, 4, 14, 17, 15, 19, 16, 7, 5, 18, 21, 19, 24, 20, 9, 6,
  22, 26, 23, 28, 25, 11, 8, 27, 31,
];

const W = 320;
const H = 84;
const PAD = 6;

function buildPaths() {
  const max = Math.max(...SERIES);
  const step = W / (SERIES.length - 1);
  const points = SERIES.map((v, i) => {
    const x = i * step;
    const y = H - PAD - (v / max) * (H - PAD * 2);
    return [x, y] as const;
  });
  const line = points.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(1)} ${y.toFixed(1)}`).join(' ');
  const area = `${line} L${W} ${H} L0 ${H} Z`;
  return { line, area, last: points[points.length - 1] };
}

export function DashboardAnalytics() {
  const { line, area, last } = buildPaths();

  return (
    <Band>
      <Inner>
        <div className="grid gap-y-12 lg:grid-cols-12 lg:items-center lg:gap-x-16">
          {/* Mirrored from the AI section: visual left, argument right. */}
          <Reveal variant="frame" className="lg:col-span-7">
            <AppFrame title="wacrm / dashboard — last 30 days">
              <div className="grid grid-cols-2 divide-x divide-y divide-border sm:grid-cols-4 sm:divide-y-0">
                {METRICS.map((m) => (
                  <div key={m.label} className="px-4 py-4">
                    <p className="text-[10px] tracking-[0.14em] text-muted-foreground uppercase [font-family:var(--font-plex)]">
                      {m.label}
                    </p>
                    <p className="mt-2 text-[1.5rem] leading-none font-medium tracking-[-0.02em] text-foreground [font-family:var(--font-display)]">
                      {m.value}
                    </p>
                    <p className="mt-1.5 text-[10.5px] text-muted-foreground [font-family:var(--font-plex)]">
                      {m.delta}
                    </p>
                  </div>
                ))}
              </div>

              <div className="border-t border-border p-5">
                <div className="flex items-baseline justify-between">
                  <p className="text-[11px] text-muted-foreground [font-family:var(--font-plex)]">
                    Conversations / day
                  </p>
                  <div className="flex gap-1">
                    {['7d', '30d', '90d'].map((r, i) => (
                      <span
                        key={r}
                        className={
                          i === 1
                            ? 'rounded bg-foreground px-1.5 py-0.5 text-[10px] text-background'
                            : 'rounded px-1.5 py-0.5 text-[10px] text-muted-foreground'
                        }
                      >
                        {r}
                      </span>
                    ))}
                  </div>
                </div>

                <svg
                  viewBox={`0 0 ${W} ${H}`}
                  preserveAspectRatio="none"
                  role="img"
                  aria-label="Illustrative chart of daily conversation volume trending upward over thirty days"
                  className="mt-4 h-24 w-full"
                >
                  {[0.25, 0.5, 0.75].map((f) => (
                    <line
                      key={f}
                      x1="0"
                      x2={W}
                      y1={H * f}
                      y2={H * f}
                      stroke="var(--border)"
                      strokeWidth="1"
                      vectorEffect="non-scaling-stroke"
                    />
                  ))}
                  <path d={area} fill="var(--primary-soft)" />
                  <path
                    d={line}
                    fill="none"
                    stroke="var(--primary)"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    vectorEffect="non-scaling-stroke"
                    className="m-draw-on-reveal"
                    style={{ '--dash': 720 } as CSSProperties}
                  />
                  <circle cx={last[0]} cy={last[1]} r="3" fill="var(--signal)" />
                </svg>
              </div>
            </AppFrame>
            <FrameCaption>
              Illustrative data. The dashboard reports your own account only.
            </FrameCaption>
          </Reveal>

          <div className="lg:col-span-5">
            <SectionHead
              eyebrow="Dashboard"
              title="What actually happened, not a vanity chart."
            />
            <Reveal delay={110}>
              <dl className="mt-9 border-t border-border">
                {EXPLAINERS.map((e) => (
                  <div key={e.title} className="border-b border-border py-4">
                    <dt className="text-[14px] font-medium text-foreground">{e.title}</dt>
                    <dd className="mt-1.5 max-w-[48ch] text-[13.5px] leading-[1.6] text-muted-foreground">
                      {e.body}
                    </dd>
                  </div>
                ))}
              </dl>
            </Reveal>
          </div>
        </div>
      </Inner>
    </Band>
  );
}

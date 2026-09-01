import type { CSSProperties, ReactNode } from 'react';

import { cn } from '@/lib/utils';

/**
 * ============================================================
 * MARKETING SYMBOL SYSTEM
 *
 * An original set of illustrated marks for the public site. One
 * construction rule, applied to every symbol:
 *
 *   - a single 40×40 field, artwork inset to roughly 4–36
 *   - 1.5px strokes in the page's charcoal (`currentColor`)
 *   - flat pale-green fills, used as *areas* — the one place on the
 *     site green is allowed to be a shape rather than an accent
 *   - simple geometry only: rectangles, circles, straight runs
 *   - generous internal white space; never more than one filled shape
 *
 * These replace generic icon-in-a-circle treatments. Each one draws
 * the actual product noun (a template with its variable slot, a lock
 * straddling two isolated panels) rather than a stock metaphor.
 *
 * MOTION: symbols animate once, on hover/focus of an ancestor marked
 * `group/sym` — never on their own, never in a loop. Parts marked
 * `m-sym-draw` draw themselves in; parts marked `m-sym-enter` arrive.
 * Both are inert under `prefers-reduced-motion` (see globals.css).
 *
 * ACCESSIBILITY: every symbol is decorative and sits beside a real
 * text label, so it is unconditionally `aria-hidden`.
 * ============================================================
 */

/** Pale-green area fill. Overridable per-tone (see `tone`). */
const FILL = 'var(--sym-fill, var(--mint-strong))';
/** Page-colored fill, for shapes that must knock out what's behind them. */
const KNOCKOUT = 'var(--sym-bg, var(--card))';

export type SymbolName =
  | 'inbox'
  | 'campaign'
  | 'contacts'
  | 'template'
  | 'ai'
  | 'economics'
  | 'analytics'
  | 'language'
  | 'security'
  | 'connect';

const SYMBOLS: Record<SymbolName, ReactNode> = {
  // A message arriving into a tray — the shared inbox, not a mail icon.
  inbox: (
    <>
      <g className="m-sym-enter">
        <rect x="11" y="4" width="18" height="12" rx="3" fill={FILL} stroke="none" />
        <path d="M17 16v3.4l4.4-3.4" fill={FILL} stroke="none" />
      </g>
      <path d="M5 26 8.5 20.5h23L35 26v6a2.5 2.5 0 0 1-2.5 2.5h-25A2.5 2.5 0 0 1 5 32Z" />
      <path d="M5 26h7.5l1.5 2.5h12l1.5-2.5H35" />
    </>
  ),

  // One message fanning out to many — a broadcast, drawn literally.
  campaign: (
    <>
      <rect x="4" y="12.5" width="13" height="11" rx="3" fill={FILL} stroke="none" />
      <path d="M9 23.5v3.5l4-3.5" fill={FILL} stroke="none" />
      <g className="m-sym-draw" style={{ '--dash': 15 } as CSSProperties}>
        <path d="M19.5 16.5 30 10.5" />
        <path d="M19.5 18h11" />
        <path d="M19.5 19.5 30 25.5" />
      </g>
      <circle cx="33" cy="9" r="2.2" />
      <circle cx="34" cy="18" r="2.2" />
      <circle cx="33" cy="27" r="2.2" />
    </>
  ),

  // A stacked contact record, with a presence dot that arrives.
  contacts: (
    <>
      <rect x="12" y="5" width="22" height="24" rx="3" />
      <rect x="6" y="10" width="24" height="25" rx="3" fill={KNOCKOUT} />
      <circle cx="18" cy="19" r="3.6" fill={FILL} stroke="none" />
      <path d="M12.5 29a5.5 5.5 0 0 1 11 0" />
      <circle
        cx="26.5"
        cy="15"
        r="2"
        fill="var(--sym-signal, var(--signal))"
        stroke="none"
        className="m-sym-enter"
      />
    </>
  ),

  // A document whose middle line is a filled variable slot — the {{1}}
  // placeholder that makes a WhatsApp template a template.
  template: (
    <>
      <path d="M10 5h13l7 7v21a2 2 0 0 1-2 2H10a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2Z" />
      <path d="M23 5v5a2 2 0 0 0 2 2h5" />
      <path d="M13 19h8" />
      <rect x="13" y="23.5" width="14" height="4.5" rx="2.25" fill={FILL} stroke="none" />
    </>
  ),

  // A nib, not a robot: the AI drafts, a person still signs off.
  ai: (
    <>
      <path d="M14.5 25.5 26 14a3.2 3.2 0 0 1 4.5 4.5L19 30Z" />
      <path d="M14.5 25.5 19 30l-7 2.5Z" fill={FILL} stroke="none" />
      <path
        className="m-sym-enter"
        d="M11 5.5 12.4 9.6 16.5 11 12.4 12.4 11 16.5 9.6 12.4 5.5 11 9.6 9.6Z"
        fill={FILL}
        stroke="none"
      />
    </>
  ),

  // A receipt: the cost estimate, itemised, with a torn edge.
  economics: (
    <>
      <path d="M9 5h22v27.5l-3.67 2.5-3.67-2.5-3.66 2.5-3.67-2.5-3.67 2.5L9 32.5Z" />
      <rect x="13" y="10.5" width="14" height="3.5" rx="1.75" fill={FILL} stroke="none" />
      <text
        x="20"
        y="27"
        textAnchor="middle"
        fontSize="14"
        fill="currentColor"
        stroke="none"
      >
        ₹
      </text>
    </>
  ),

  // Bars for what happened, a drawn line for where it's going.
  analytics: (
    <>
      <path d="M6 32h28" />
      <rect x="9" y="24" width="5" height="8" />
      <rect x="17.5" y="19" width="5" height="13" fill={FILL} />
      <rect x="26" y="14" width="5" height="18" />
      <path
        className="m-sym-draw"
        style={{ '--dash': 24 } as CSSProperties}
        d="M9.5 17 20 11.5 30.5 6.5"
      />
    </>
  ),

  // The language mark: a WhatsApp bubble that happens to be speaking
  // Devanagari. No flags, no maps.
  language: (
    <>
      <rect x="5" y="6" width="30" height="21" rx="4" />
      <path d="M12.5 27v5.5l6.5-5.5" />
      <rect x="12" y="21" width="16" height="2.5" rx="1.25" fill={FILL} stroke="none" />
      <text x="20" y="19" textAnchor="middle" fontSize="13" fill="currentColor" stroke="none">
        अ
      </text>
    </>
  ),

  // Two panels that cannot see each other, with the lock on the seam.
  // This is tenant isolation specifically, not a generic shield.
  security: (
    <>
      <rect x="5" y="9" width="12.5" height="22" rx="2.5" fill={FILL} />
      <rect x="22.5" y="9" width="12.5" height="22" rx="2.5" />
      <path d="M20 6v28" />
      <path
        className="m-sym-draw"
        style={{ '--dash': 12 } as CSSProperties}
        d="M17.4 19.5v-2.3a2.6 2.6 0 0 1 5.2 0v2.3"
      />
      <rect x="15.8" y="19.5" width="8.4" height="7.5" rx="1.6" fill={KNOCKOUT} />
    </>
  ),

  // A number on one side, the workspace on the other, wired together.
  connect: (
    <>
      <rect x="3" y="10.5" width="12" height="11" rx="3" fill={FILL} stroke="none" />
      <path d="M7.5 21.5V25l4-3.5" fill={FILL} stroke="none" />
      <rect x="25" y="8" width="11" height="17" rx="2.5" />
      <path d="M25 13h11" />
      <path
        className="m-sym-draw"
        style={{ '--dash': 10 } as CSSProperties}
        d="M15.5 16h9"
      />
      <circle cx="20" cy="16" r="2.4" fill={KNOCKOUT} />
    </>
  ),
};

/**
 * The wordmark. A conversation bubble knocked out of a solid ink tile —
 * same construction language as the symbols above, sized to sit on a
 * baseline next to 15px type.
 */
export function Wordmark({
  label,
  className,
}: {
  label: string;
  className?: string;
}) {
  return (
    <span
      className={cn(
        'flex items-center gap-2.5 text-[15px] font-medium tracking-[-0.02em] text-foreground [font-family:var(--font-display)]',
        className,
      )}
    >
      <span
        aria-hidden
        className="flex size-[22px] shrink-0 items-center justify-center rounded-[7px] bg-foreground"
      >
        <svg viewBox="0 0 16 16" className="size-[11px]" fill="none" aria-hidden="true">
          <path
            d="M2 5.2A2.2 2.2 0 0 1 4.2 3h7.6A2.2 2.2 0 0 1 14 5.2v4.1a2.2 2.2 0 0 1-2.2 2.2H7.4L4 14v-2.5h-.2A1.8 1.8 0 0 1 2 9.7Z"
            fill="var(--signal)"
          />
        </svg>
      </span>
      {label}
    </span>
  );
}

export function Symbol({
  name,
  className,
  tone = 'light',
}: {
  name: SymbolName;
  className?: string;
  /** `dark` retunes the fills for the ink-colored security section. */
  tone?: 'light' | 'dark';
}) {
  return (
    <svg
      viewBox="0 0 40 40"
      role="presentation"
      aria-hidden="true"
      focusable="false"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn('size-10', className)}
      style={
        tone === 'dark'
          ? ({
              '--sym-fill': 'var(--ink-line)',
              '--sym-bg': 'var(--ink)',
              '--sym-signal': 'var(--signal)',
            } as CSSProperties)
          : undefined
      }
    >
      {SYMBOLS[name]}
    </svg>
  );
}

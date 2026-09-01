import { Band } from './section';

/**
 * The one moving sequence on the page.
 *
 * Not a logo carousel — we have no customers to name, and inventing
 * them would be the fastest way to make the site untrustworthy. What
 * drifts past instead is the actual material the product handles:
 * inbound WhatsApp messages, in the mix of English, हिंदी and Hinglish
 * an Indian SMB inbox really receives. It doubles as the argument for
 * multilingual drafting without a word of marketing copy.
 *
 * Behaviour: slow, paused on hover and on keyboard focus, masked at
 * both edges, and completely still under `prefers-reduced-motion`
 * (see globals.css) — where it degrades to a static, readable row.
 */
const MESSAGES = [
  'Bhaiya, ye abhi available hai?',
  'क्या आज डिलीवरी हो जाएगी?',
  'Can you hold two boxes for me?',
  'SHOP',
  'Order kitne baje ready hoga?',
  'Thank you 🙏',
  'Andheri deliver karte ho?',
  'Kal subah aa sakta hoon?',
  'Price kya hai iska?',
  'मुझे बिल चाहिए था',
];

function Track({ hidden }: { hidden?: boolean }) {
  return (
    <ul
      aria-hidden={hidden || undefined}
      className="flex shrink-0 items-center gap-3 pr-3"
    >
      {MESSAGES.map((m) => (
        <li
          key={m}
          className="shrink-0 rounded-lg rounded-tl-sm border border-border bg-card px-3.5 py-2.5 text-[13px] whitespace-nowrap text-foreground"
        >
          {m}
        </li>
      ))}
    </ul>
  );
}

export function MessageMarquee() {
  return (
    <Band tone="raised" className="overflow-hidden">
      <div className="mx-auto max-w-6xl px-6 pt-14 sm:px-10 sm:pt-16">
        <p className="text-[10.5px] tracking-[0.16em] text-muted-foreground uppercase [font-family:var(--font-plex)]">
          What actually arrives in the inbox
        </p>
      </div>

      <div
        className="m-marquee relative mt-6 pb-14 sm:pb-16 [mask-image:linear-gradient(to_right,transparent,black_6%,black_94%,transparent)]"
        tabIndex={-1}
      >
        <div className="m-marquee-track flex">
          {/* Rendered twice so the loop has no seam; the duplicate is
              hidden from assistive tech so nothing is announced twice. */}
          <Track />
          <Track hidden />
        </div>
      </div>
    </Band>
  );
}

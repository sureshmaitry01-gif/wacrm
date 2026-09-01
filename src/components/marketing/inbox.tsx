import { Band, Inner, SectionHead } from './section';
import { AppFrame, FrameCaption } from './browser-frame';
import { Reveal } from './reveal';

const CAPABILITIES = [
  {
    title: 'One inbox for the whole team',
    body: 'Every WhatsApp conversation lands in a single shared inbox instead of on somebody’s personal phone.',
  },
  {
    title: 'Assign and resolve',
    body: 'Hand a conversation to the right teammate and close it when it’s handled, so nothing sits forgotten.',
  },
  {
    title: 'Full customer context',
    body: 'The whole thread, the contact record, and the campaign that started it — all on one screen.',
  },
  {
    title: 'Status at a glance',
    body: 'Open, assigned, and resolved make it obvious what is still waiting on your team.',
  },
];

const ROWS = [
  { name: 'Ananya Rao', msg: 'Perfect, I’ll come by at 5.', who: 'Priya S.', status: 'Open', wait: '2m' },
  { name: 'Rahul Mehta', msg: 'Thank you 🙏', who: 'Priya S.', status: 'Resolved', wait: '—' },
  { name: 'Fatima Khan', msg: 'Delivery today?', who: 'Unassigned', status: 'Open', wait: '1h', flag: true },
  { name: 'Vikram Shah', msg: 'Can I change the order?', who: 'Arjun K.', status: 'Open', wait: '3h' },
  { name: 'Meera Nair', msg: 'Do you deliver to Andheri?', who: 'Unassigned', status: 'Open', wait: '4h', flag: true },
];

export function Inbox() {
  return (
    <Band tone="raised">
      <Inner>
        <div className="grid gap-y-10 lg:grid-cols-12 lg:gap-x-14">
          <SectionHead
            className="lg:col-span-5"
            eyebrow="Shared inbox"
            title="Every reply, one place, nothing dropped."
          />

          <Reveal delay={100} className="lg:col-span-6 lg:col-start-7 lg:pt-2">
            <dl className="border-t border-border">
              {CAPABILITIES.map((c) => (
                <div key={c.title} className="border-b border-border py-4">
                  <dt className="text-[14px] font-medium text-foreground">{c.title}</dt>
                  <dd className="mt-1.5 max-w-[52ch] text-[13.5px] leading-[1.6] text-muted-foreground">
                    {c.body}
                  </dd>
                </div>
              ))}
            </dl>
          </Reveal>
        </div>

        {/* A different screen from the hero's thread view: the list the
            team triages from, where assignment and waiting time live. */}
        <Reveal variant="frame" delay={140} className="mt-14 sm:mt-16">
          <AppFrame title="wacrm / inbox — all conversations">
            <div className="flex flex-wrap items-center gap-2 border-b border-border bg-card-2 px-4 py-2.5">
              <span className="rounded bg-foreground px-2 py-0.5 text-[10.5px] text-background">
                Open · 4
              </span>
              <span className="rounded px-2 py-0.5 text-[10.5px] text-muted-foreground">Mine · 2</span>
              <span className="rounded px-2 py-0.5 text-[10.5px] text-muted-foreground">
                Unassigned · 2
              </span>
              <span className="ml-auto text-[10.5px] text-muted-foreground [font-family:var(--font-plex)]">
                Sorted by waiting
              </span>
            </div>

            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-border">
                  {['Contact', 'Last message', 'Assignee', 'Status', 'Waiting'].map((h, i) => (
                    <th
                      key={h}
                      scope="col"
                      className={`px-4 py-2.5 text-[10px] font-normal tracking-[0.14em] text-muted-foreground uppercase [font-family:var(--font-plex)] ${
                        i === 1 ? 'hidden sm:table-cell' : ''
                      } ${i === 2 ? 'hidden md:table-cell' : ''} ${i === 4 ? 'hidden sm:table-cell' : ''}`}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {ROWS.map((r) => (
                  <tr key={r.name} className="border-b border-border last:border-b-0">
                    <td className="px-4 py-3 text-[12.5px] font-medium text-foreground">{r.name}</td>
                    <td className="hidden max-w-0 truncate px-4 py-3 text-[12.5px] text-muted-foreground sm:table-cell">
                      {r.msg}
                    </td>
                    <td
                      className={`hidden px-4 py-3 text-[12px] md:table-cell ${
                        r.flag ? 'text-muted-foreground italic' : 'text-foreground'
                      }`}
                    >
                      {r.who}
                    </td>
                    <td className="px-4 py-3">
                      {r.status === 'Resolved' ? (
                        <span className="inline-flex items-center rounded bg-primary-soft px-2 py-0.5 text-[10.5px] text-primary">
                          Resolved
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 rounded border border-border px-2 py-0.5 text-[10.5px] text-muted-foreground">
                          <span aria-hidden className="size-1.5 rounded-full bg-signal" />
                          Open
                        </span>
                      )}
                    </td>
                    <td className="hidden px-4 py-3 text-[11.5px] text-muted-foreground sm:table-cell [font-family:var(--font-plex)]">
                      {r.wait}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </AppFrame>
          <FrameCaption>
            Illustrative data. Roles decide who can reassign, resolve, or change settings.
          </FrameCaption>
        </Reveal>
      </Inner>
    </Band>
  );
}

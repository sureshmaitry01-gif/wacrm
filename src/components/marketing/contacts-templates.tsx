import { Band, Cell, CellLabel, GridFrame, Inner, SectionHead } from './section';
import { Symbol } from './symbols';
import { Reveal } from './reveal';

const CONTACTS = [
  { name: 'Ananya Rao', phone: '+91 98••• ••42', tags: ['Regular', 'Diwali-24'], added: 'Mar 2025' },
  { name: 'Rahul Mehta', phone: '+91 99••• ••07', tags: ['VIP'], added: 'Jan 2025' },
  { name: 'Fatima Khan', phone: '+91 97••• ••18', tags: ['New'], added: 'Sep 2025' },
  { name: 'Vikram Shah', phone: '+91 96••• ••63', tags: ['Regular'], added: 'Nov 2024' },
];

const TEMPLATES = [
  { name: 'Diwali offer', category: 'Marketing', status: 'Approved' },
  { name: 'Order ready for pickup', category: 'Utility', status: 'Approved' },
  { name: 'Weekend menu', category: 'Marketing', status: 'In review' },
];

export function ContactsTemplates() {
  return (
    <Band tone="raised">
      <Inner>
        <SectionHead
          eyebrow="Contacts & templates"
          title="The groundwork every campaign runs on."
          lede="Both halves of a send live in the product: who you are messaging, and the approved template you are messaging them with."
        />

        <Reveal delay={120} className="mt-14 sm:mt-16">
          <GridFrame className="lg:grid-cols-3">
            {/* Contacts — the large cell */}
            <Cell className="p-0! lg:col-span-2 lg:row-span-2">
              <div className="flex items-center justify-between gap-3 border-b border-border px-5 py-3.5">
                <span className="text-[13px] font-medium text-foreground">
                  2,481 contacts
                </span>
                <span className="rounded border border-border px-2 py-1 text-[10.5px] text-muted-foreground">
                  Import CSV
                </span>
              </div>
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-border">
                    {['Name', 'Phone', 'Tags', 'Added'].map((h, i) => (
                      <th
                        key={h}
                        scope="col"
                        className={`px-5 py-2.5 text-[10px] font-normal tracking-[0.14em] text-muted-foreground uppercase [font-family:var(--font-plex)] ${
                          i === 1 ? 'hidden sm:table-cell' : ''
                        } ${i === 3 ? 'hidden md:table-cell' : ''}`}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {CONTACTS.map((c) => (
                    <tr key={c.name} className="border-b border-border last:border-b-0">
                      <td className="px-5 py-3 text-[12.5px] font-medium text-foreground">
                        {c.name}
                      </td>
                      <td className="hidden px-5 py-3 text-[12px] text-muted-foreground sm:table-cell [font-family:var(--font-plex)]">
                        {c.phone}
                      </td>
                      <td className="px-5 py-3">
                        <span className="flex flex-wrap gap-1">
                          {c.tags.map((t) => (
                            <span
                              key={t}
                              className="rounded bg-mint px-1.5 py-0.5 text-[10.5px] text-primary"
                            >
                              {t}
                            </span>
                          ))}
                        </span>
                      </td>
                      <td className="hidden px-5 py-3 text-[11.5px] text-muted-foreground md:table-cell [font-family:var(--font-plex)]">
                        {c.added}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Cell>

            {/* Prose cells sit in the same grid as the interface cells. */}
            <Cell className="group/sym">
              <Symbol name="contacts" className="size-8 text-foreground" />
              <CellLabel className="mt-4">Bring your list in</CellLabel>
              <p className="mt-2.5 text-[13px] leading-[1.65] text-muted-foreground">
                Import a CSV or add people one at a time. Phone numbers are
                stored against the contact, not scattered across sheets.
              </p>
            </Cell>

            <Cell>
              <CellLabel>Segment without exporting</CellLabel>
              <p className="mt-2.5 text-[13px] leading-[1.65] text-muted-foreground">
                Target everyone, a tag, a custom field condition, or an uploaded
                list — chosen inside the campaign, not in a spreadsheet
                beforehand.
              </p>
            </Cell>

            <Cell className="group/sym">
              <Symbol name="template" className="size-8 text-foreground" />
              <CellLabel className="mt-4">Templates and their status</CellLabel>
              <p className="mt-2.5 text-[13px] leading-[1.65] text-muted-foreground">
                Marketing, Utility and Authentication templates in one place,
                with Meta’s review state visible while it is pending.
              </p>
            </Cell>

            <Cell className="p-0! lg:col-span-2">
              <div className="border-b border-border px-5 py-3.5">
                <CellLabel>Message templates</CellLabel>
              </div>
              {TEMPLATES.map((t) => (
                <div
                  key={t.name}
                  className="flex flex-wrap items-center gap-x-4 gap-y-1.5 border-b border-border px-5 py-3 last:border-b-0"
                >
                  <span className="text-[12.5px] font-medium text-foreground">{t.name}</span>
                  <span className="rounded border border-border px-1.5 py-0.5 text-[10.5px] text-muted-foreground">
                    {t.category}
                  </span>
                  <span
                    className={`ml-auto flex items-center gap-1.5 text-[11px] ${
                      t.status === 'Approved' ? 'text-primary' : 'text-muted-foreground'
                    } [font-family:var(--font-plex)]`}
                  >
                    <span
                      aria-hidden
                      className={`size-1.5 rounded-full ${
                        t.status === 'Approved' ? 'bg-signal' : 'bg-border'
                      }`}
                    />
                    {t.status}
                  </span>
                </div>
              ))}
            </Cell>
          </GridFrame>
        </Reveal>
      </Inner>
    </Band>
  );
}

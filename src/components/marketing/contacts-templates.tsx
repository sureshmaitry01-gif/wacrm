import { Section, SectionHeader } from './section';
import { BrowserFrame } from './browser-frame';

export function ContactsTemplates() {
  return (
    <Section tone="muted">
      <div className="grid gap-14 lg:grid-cols-[1fr_1fr] lg:items-center">
        <BrowserFrame title="Contacts">
          <div className="p-5 text-sm">
            <div className="mb-3 flex items-center justify-between">
              <span className="font-medium text-foreground">2,481 contacts</span>
              <span className="rounded-md border border-border px-2 py-1 text-xs text-muted-foreground">
                Import CSV
              </span>
            </div>
            <div className="divide-y divide-border rounded-lg border border-border">
              {[
                { name: 'Ananya Rao', tag: 'Regular' },
                { name: 'Rahul Mehta', tag: 'VIP' },
                { name: 'Fatima Khan', tag: 'New' },
              ].map((c) => (
                <div key={c.name} className="flex items-center justify-between px-3.5 py-2.5">
                  <span className="text-foreground">{c.name}</span>
                  <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                    {c.tag}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </BrowserFrame>

        <div>
          <SectionHeader
            eyebrow="Contacts & templates"
            title="The groundwork every campaign needs."
          />
          <dl className="mt-8 space-y-6">
            <div>
              <dt className="text-[15px] font-semibold text-foreground">
                Import contacts from a CSV
              </dt>
              <dd className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                Bring an existing customer list in, or add people one at a
                time. Tags and custom fields let you segment an audience for
                a campaign.
              </dd>
            </div>
            <div>
              <dt className="text-[15px] font-semibold text-foreground">
                Manage WhatsApp templates
              </dt>
              <dd className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                Keep Marketing, Utility, and Authentication templates
                organized in one place, with status visible as Meta reviews
                each one.
              </dd>
            </div>
            <div>
              <dt className="text-[15px] font-semibold text-foreground">
                Segment by tag or custom field
              </dt>
              <dd className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                Target a campaign at everyone, a tag, a custom field
                condition, or an uploaded CSV list — without exporting to a
                spreadsheet first.
              </dd>
            </div>
          </dl>
        </div>
      </div>
    </Section>
  );
}

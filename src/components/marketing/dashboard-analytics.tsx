import { Section, SectionHeader } from './section';
import { BrowserFrame } from './browser-frame';

export function DashboardAnalytics() {
  return (
    <Section>
      <div className="grid gap-14 lg:grid-cols-[1fr_1.1fr] lg:items-center">
        <div>
          <SectionHeader
            eyebrow="Dashboard"
            title="See what’s actually happening, not just a vanity chart."
          />
          <ul className="mt-8 space-y-4 text-sm leading-relaxed text-muted-foreground">
            <li>
              <span className="font-medium text-foreground">Conversation volume</span> —
              a daily trend of conversations over the last 7, 30, or 90 days.
            </li>
            <li>
              <span className="font-medium text-foreground">Response time</span> —
              how quickly your team is actually getting back to customers.
            </li>
            <li>
              <span className="font-medium text-foreground">Pipeline breakdown</span> —
              where deals or conversations sit across your stages.
            </li>
            <li>
              <span className="font-medium text-foreground">Activity feed</span> —
              a running log of what changed, so nothing gets lost between shifts.
            </li>
          </ul>
        </div>

        <BrowserFrame title="Dashboard — Last 30 days">
          <div className="grid grid-cols-2 gap-3 p-5 text-sm sm:grid-cols-4">
            {[
              { label: 'Conversations', value: '318' },
              { label: 'New contacts', value: '54' },
              { label: 'Avg. response', value: '4m' },
              { label: 'Campaigns sent', value: '6' },
            ].map((m) => (
              <div key={m.label} className="rounded-lg border border-border bg-card-2 p-3">
                <p className="text-xs text-muted-foreground">{m.label}</p>
                <p className="mt-1 text-lg font-semibold text-foreground">{m.value}</p>
              </div>
            ))}
            <div className="col-span-2 flex h-24 items-end gap-1.5 rounded-lg border border-border p-3 sm:col-span-4">
              {[40, 55, 35, 70, 60, 80, 50, 65, 90, 58, 72, 66].map((h, i) => (
                <span
                  key={i}
                  className="flex-1 rounded-sm bg-primary/70"
                  style={{ height: `${h}%` }}
                />
              ))}
            </div>
          </div>
        </BrowserFrame>
      </div>
    </Section>
  );
}

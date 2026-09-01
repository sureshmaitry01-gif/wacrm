import { Band, Inner, Eyebrow, Heading, Lede } from './section';
import { Symbol } from './symbols';
import { Reveal } from './reveal';

const ITEMS = [
  {
    title: 'Your data stays yours',
    body: 'Every account is isolated at the database level. One team cannot read another team’s contacts, conversations, or campaigns.',
  },
  {
    title: 'Signed webhook verification',
    body: 'Inbound events from WhatsApp and our payment provider are cryptographically verified before anything is trusted or applied.',
  },
  {
    title: 'Secrets never reach the client',
    body: 'API keys and provider credentials are handled server-side only — never shipped to the browser, never written to logs.',
  },
  {
    title: 'Role-based team access',
    body: 'Owner, admin, agent and viewer decide who can change settings and who can only work the inbox.',
  },
  {
    title: 'No automatic AI sending',
    body: 'The AI drafts. It cannot send a campaign or a reply on its own, and there is no setting that lets it.',
  },
  {
    title: 'PII-conscious by default',
    body: 'Operational logs and audit records are built to avoid capturing customer message content they do not need.',
  },
];

export function Security() {
  return (
    <Band tone="ink">
      <Inner>
        <div className="grid gap-y-12 lg:grid-cols-12 lg:gap-x-16">
          <Reveal className="group/sym lg:col-span-5">
            <span className="flex size-16 items-center justify-center rounded-lg border border-border bg-ink-2 text-foreground">
              <Symbol name="security" tone="dark" className="size-9" />
            </span>
            <Eyebrow tone="ink" className="mt-7">
              Security & trust
            </Eyebrow>
            <Heading className="mt-5">Tenant isolation from the first migration.</Heading>
            <Lede className="mt-5">
              Not a policy page written after launch. These are properties of how
              the data layer is built, and they were true before there was
              anything to protect.
            </Lede>
          </Reveal>

          <Reveal delay={110} className="lg:col-span-7 lg:pt-2">
            <dl className="grid border-t border-border sm:grid-cols-2 sm:gap-x-10">
              {ITEMS.map((item) => (
                <div key={item.title} className="border-b border-border py-5">
                  <dt className="text-[14px] font-medium text-foreground">{item.title}</dt>
                  <dd className="mt-2 max-w-[46ch] text-[13px] leading-[1.65] text-muted-foreground">
                    {item.body}
                  </dd>
                </div>
              ))}
            </dl>

            <p className="mt-7 max-w-[58ch] text-[12.5px] leading-relaxed text-muted-foreground">
              No compliance badges here, because we do not hold any yet. When
              there is a certification worth naming, it will be named — with the
              audit behind it.
            </p>
          </Reveal>
        </div>
      </Inner>
    </Band>
  );
}

import { MarketingNav } from './nav';
import { Footer } from './footer';
import { Eyebrow, Heading } from './section';

/**
 * Shared shell for `/privacy`, `/terms` and `/support`, so the public
 * site's structure (bounded column, hairline rules, mono eyebrow,
 * display heading) holds on the supporting pages too instead of them
 * reading as unstyled documents bolted onto a designed site.
 *
 * These pages remain explicitly beta-stage summaries — the wording says
 * so, and this shell does nothing to dress them up as finished legal
 * copy.
 */
export function LegalPage({
  eyebrow,
  title,
  intro,
  children,
}: {
  eyebrow: string;
  title: string;
  intro: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="landing-scope min-h-screen">
      <MarketingNav />
      <main className="mx-auto w-full max-w-[1440px] border-border md:border-x">
        <div className="mx-auto max-w-3xl px-6 py-20 sm:px-10 sm:py-28">
          <Eyebrow>{eyebrow}</Eyebrow>
          <Heading level={1} size="md" className="mt-5">
            {title}
          </Heading>
          <p className="mt-5 max-w-[54ch] text-[14.5px] leading-[1.7] text-muted-foreground">
            {intro}
          </p>
          <div className="mt-12 border-t border-border">{children}</div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

export function LegalSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="border-b border-border py-7">
      <h2 className="text-[15px] font-medium text-foreground">{title}</h2>
      <div className="mt-3 max-w-[64ch] text-[14px] leading-[1.75] text-muted-foreground [&_a]:text-foreground [&_a]:underline [&_a]:underline-offset-2">
        {children}
      </div>
    </section>
  );
}

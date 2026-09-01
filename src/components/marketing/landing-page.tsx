import { MarketingNav } from './nav';
import { Shell } from './section';
import { Hero } from './hero';
import { Problem } from './problem';
import { Workflow } from './workflow';
import { Inbox } from './inbox';
import { Campaigns } from './campaigns';
import { AIWriter } from './ai-writer';
import { Economics } from './economics';
import { ContactsTemplates } from './contacts-templates';
import { DashboardAnalytics } from './dashboard-analytics';
import { MessageMarquee } from './marquee';
import { IndiaFirst } from './india-first';
import { Pricing } from './pricing';
import { Security } from './security';
import { FAQ } from './faq';
import { FinalCTA } from './final-cta';
import { Footer } from './footer';

/**
 * The public marketing page (`/`).
 *
 * Forced light + brand-green via `.landing-scope` (see globals.css)
 * regardless of a visitor's saved app theme: the authenticated app is
 * themeable, the public site is a fixed brand surface.
 *
 * Section order is a rhythm, not a list. No two adjacent bands share a
 * composition — an editorial statement is followed by a ruled grid,
 * then a horizontal sequence, then a wide product frame, then a bento —
 * and surface tone alternates paper / raised throughout, with exactly
 * one mint band and one ink band to mark the two moments that matter
 * most (India-first, and security).
 */
export function LandingPage() {
  return (
    <div className="landing-scope min-h-screen">
      <MarketingNav />
      <Shell>
        <main>
          <Hero />
          <Problem />
          <Workflow />
          <Inbox />
          <Campaigns />
          <AIWriter />
          <Economics />
          <ContactsTemplates />
          <DashboardAnalytics />
          <MessageMarquee />
          <IndiaFirst />
          <Pricing />
          <Security />
          <FAQ />
        </main>
        <FinalCTA />
      </Shell>
      <Footer />
    </div>
  );
}

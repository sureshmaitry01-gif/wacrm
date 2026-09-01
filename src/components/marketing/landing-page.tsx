import { MarketingNav } from './nav';
import { Hero } from './hero';
import { Problem } from './problem';
import { Workflow } from './workflow';
import { Inbox } from './inbox';
import { Campaigns } from './campaigns';
import { AIWriter } from './ai-writer';
import { Economics } from './economics';
import { ContactsTemplates } from './contacts-templates';
import { DashboardAnalytics } from './dashboard-analytics';
import { IndiaFirst } from './india-first';
import { Pricing } from './pricing';
import { Security } from './security';
import { FAQ } from './faq';
import { FinalCTA } from './final-cta';
import { Footer } from './footer';

/**
 * The public marketing page (`/`). Forced light + emerald via the
 * `.landing-scope` class (see globals.css) regardless of a visitor's
 * saved app theme — the authenticated app is themeable, the public site
 * is a fixed brand surface.
 */
export function LandingPage() {
  return (
    <div className="landing-scope min-h-screen">
      <MarketingNav />
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
        <IndiaFirst />
        <Pricing />
        <Security />
        <FAQ />
      </main>
      <FinalCTA />
      <Footer />
    </div>
  );
}

import type { Metadata } from 'next'
import { redirect } from 'next/navigation'

import { createClient } from '@/lib/supabase/server'
import { LandingPage } from '@/components/marketing/landing-page'
import { PRODUCT_NAME } from '@/lib/marketing/product'

// Overrides the root layout's `robots: { index: false }` — the public
// marketing page is the one route that SHOULD be indexed. Auth pages,
// the dashboard, and every other app route keep the layout default.
export const metadata: Metadata = {
  title: `${PRODUCT_NAME} — WhatsApp campaigns and shared inbox for growing businesses`,
  description:
    'Send WhatsApp campaigns, work every reply from one shared team inbox, and see what a campaign will cost before it goes out. AI drafts your message in English, Hindi, or Hinglish — you decide what gets sent.',
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    title: `${PRODUCT_NAME} — WhatsApp campaigns and shared inbox`,
    description:
      'WhatsApp campaigns, a shared team inbox, transparent cost estimates, and an AI campaign writer for English, Hindi, and Hinglish.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: `${PRODUCT_NAME} — WhatsApp campaigns and shared inbox`,
    description:
      'WhatsApp campaigns, a shared team inbox, transparent cost estimates, and an AI campaign writer for English, Hindi, and Hinglish.',
  },
}

/**
 * `/` — public for a signed-out visitor, dashboard for a signed-in user.
 *
 * Previously this unconditionally `redirect('/dashboard')`ed regardless of
 * auth state (middleware doesn't touch `/`, so an unauthenticated visitor
 * bounced to /dashboard and then to /login). Now an unauthenticated visitor
 * sees the marketing page; a signed-in user keeps the old behavior and
 * lands straight on /dashboard.
 */
export default async function RootPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (user) {
    redirect('/dashboard')
  }

  return <LandingPage />
}

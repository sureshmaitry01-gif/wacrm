# India-first onboarding (M06)

A guided first-run experience that takes a new Indian SMB from signup to
their first WhatsApp campaign, using the M05 design system.

## What shipped

A **dashboard onboarding checklist** (`OnboardingChecklist`) — the
dashboard is the first-run landing (signup → email verify → `/dashboard`).
It shows a new account the path:

1. **Connect WhatsApp** → `Settings → WhatsApp`
2. **Add your contacts** → `Contacts`
3. **Create your first template** → `Settings → Templates` (surfaces the
   M05C AI writer, incl. **Hinglish**)
4. **Send your first campaign** → `Broadcasts → New`

The card shows a progress bar, checks off completed steps, highlights the
next action, and carries a plain-English footer: *"You pay Meta's
per-message rate directly in ₹ — we never add a markup. Marketing templates
are reviewed by WhatsApp before they can be sent."*

## No migration — state is derived, dismissal is local

**No schema change, no RLS change.** Every step's completion is derived
from **existing account-scoped rows** at read time (RLS scopes each query):

| Step | Derived from |
|---|---|
| WhatsApp | `whatsapp_config.phone_number_id` present |
| Contacts | `contacts` count > 0 |
| Template | `message_templates` count > 0 |
| Campaign | `broadcasts` count > 0 |

The card **auto-hides** once all steps complete. A user can also **dismiss**
it early; that preference is stored in **`localStorage`**, keyed per account
(`wacrm:onboarding:dismissed:<accountId>`) — device-scoped, exactly like the
theme / inbox contact-panel prefs. A persisted onboarding table was
evaluated and **deliberately avoided**: nothing here needs cross-device or
server state, so a table would be unjustified complexity. (If cross-device
dismissal is ever wanted, that's a small future migration following the
account-scoped RLS convention.)

## Architecture

- **`src/lib/onboarding/steps.ts`** — pure, deterministic step model:
  `buildOnboardingSteps(input)`, `onboardingProgress(steps)`,
  `firstIncompleteStep(steps)`. Unit-tested (`steps.test.ts`).
- **`src/components/dashboard/onboarding-checklist.tsx`** — fetches the raw
  flags and renders. Data-fetching only; the logic is the pure lib.

## i18n note (important) — why the copy is English

The app currently resolves locale from a single **deploy-wide env var**
(`NEXT_PUBLIC_APP_LOCALE`, default `en`) — there is **no per-user language
switcher**, **no `hi.json`**, and `messages.test.ts` enforces `ko.json` ↔
`en.json` key parity.

So onboarding copy is **English and hardcoded in the component/lib**, not
routed through `next-intl` — consistent with the M04/M05C campaign UI
(CampaignInsights, AI writer), which is also English-hardcoded. This:

- keeps the `ko` parity test green (no new `en.json` keys to mirror), and
- avoids guessing Korean for India-first strings.

The India-first payload is the **Hinglish AI *writing*** the template step
points to (shipped in M05C) plus the plain-English INR / no-markup / approval
framing — not a translated UI.

### Recommendation: real Hindi UI localization is a separate milestone

Shipping a genuine Hindi *interface* needs: a full `hi.json` translation of
`en.json`, a **per-user language switcher** with persistence (today locale is
per-deploy), adding `hi` to the parity test, and a translation workflow. That
is a standalone effort, not part of onboarding. Recommended for a dedicated
localization milestone.

## Empty states

The dashboard checklist is the primary smart-guidance surface. The existing
per-page empty states (contacts / templates / broadcasts) are already
`next-intl`-translated and were left as-is — rewriting their copy would force
`ko.json` parity churn for marginal benefit given the checklist already
covers the guidance. Enhancing them is best done alongside the Hindi
localization milestone above.

## Guardrails honored

No WhatsApp send/webhook, Dodo/billing, DeepSeek, or AI-quota internals
touched; no migration / RLS change; no Drizzle; no new dependencies; no
fake data; existing routes and behavior preserved.

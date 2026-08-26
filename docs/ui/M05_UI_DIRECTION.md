# M05 — Premium CRM UI redesign (direction + checkpoint plan)

Milestone **M05** restyles the app to feel like a **premium CRM / support
SaaS**, not a bulk WhatsApp sender. It is a **design-system + composition**
pass: no changes to DB/RLS, WhatsApp send/webhook, billing internals, AI
provider internals, or route behavior. Restyle, don't rewrite.

Executed **checkpoint by checkpoint**, stopping for review after each.

## Design direction

**Feel:** calm, spacious, analytical, trustworthy. Premium CRM.

**Colour budget (≈80 / 15 / 5):**
- **80% neutral** — off-white/soft-gray page, white cards, thin borders,
  quiet text hierarchy.
- **15% emerald (WhatsApp-adjacent green)** — the primary accent: primary
  buttons, active nav, key metrics, WhatsApp affordances. The existing
  `emerald` theme token ("nods at messaging without copying WhatsApp
  green") becomes the **default accent**.
- **5% AI accent (soft indigo/blue)** — a **distinct** accent, reserved for
  AI surfaces (campaign writer, AI insights) so "AI" never competes with
  the emerald brand or reads as a chatbot gimmick. New `--ai` token.

**Surfaces:** soft-gray page canvas so **white cards separate**; thin
`border`/ring; **calm** elevation (a soft 1–3px shadow, not glassmorphism);
generous padding; `rounded-xl` cards. No heavy gradients, no fake glass, no
purple-everywhere, no generic TailAdmin look.

**Mode:** **light-first** (the premium CRM references are all light). Dark
remains fully supported and selectable — the theming system is two
orthogonal axes (mode × accent), untouched structurally.

**Density:** tables dense but readable; inbox three-pane (filters · list ·
thread) with an optional right customer panel.

References were used for *direction only* (premium neutral shells, strong
shared-inbox UX, analytical campaign screens, restrained AI cards) — none
are copied.

## Checkpoints

| # | Scope | Status |
|---|---|---|
| **M05A** | Design tokens + app-shell/primitive foundation | ✅ done |
| **M05B** | Shared inbox redesign (filters · list · thread · customer panel) | ✅ done |
| **M05C** | Campaign wizard redesign + AI writer composer UI | ✅ done |
| **M05D** | Dashboard / analytics polish (KPI cards, charts) | ✅ done |
| **M05E** | Billing / settings polish | ✅ this pass |
| M05F | Contacts / templates light polish | ⏳ |

Each checkpoint keeps all four checks green and is committed separately
(`feat(m05x): …`).

## M05A — what changed (foundation only)

Token/theme + centralized primitives — **re-skins the whole app at once**
because every component already consumes semantic tokens (`bg-card`,
`text-primary`, `border-border`, …).

1. **Default light + emerald.** `DEFAULT_MODE` → `light`, `DEFAULT_THEME` →
   `emerald` (`src/lib/themes.ts`); root layout `viewport` set light-first.
   Dark/violet/etc. remain selectable.
2. **Softer light canvas.** Light `--background` nudged to a soft gray so
   white cards read as elevated panels.
3. **AI accent token.** New `--ai` / `--ai-foreground` / `--ai-soft`
   (soft indigo) → `bg-ai`, `text-ai`, `bg-ai-soft` utilities, for AI
   surfaces only.
4. **Calm elevation.** New `--shadow-card` / `--shadow-card-hover` tokens;
   the `Card` primitive gains a soft shadow (thin ring/border + calm
   shadow).
5. **Quiet premium shell.** Sticky, subtly blurred top bar; the emerald
   active-nav pill now carries the brand.

**Not** in M05A: per-screen redesigns (inbox, wizard, dashboard, billing,
contacts) — those are M05B–F.

## M05B — what changed (shared inbox)

Restyle only — no change to inbox data flow, realtime, send, assignment,
or conversation-resolution logic; the three-pane responsive layout (owned
by the page) is preserved. Worked in sub-steps:

- **M05B-1 · list** — added a list header (title + live count); the status
  filter became **segmented emerald pills** (same `filter` state, was a
  dropdown); conversation rows are now **inset rounded cards** with a soft
  emerald selected state (ring + tint), **tinted avatar** fallbacks, an
  **unread dot** on the avatar, and bolder unread rows.
- **M05B-2 · thread + composer** — replaced the **WhatsApp-style doodle
  canvas with a clean soft-gray surface** (`THREAD_BG_CLASSES`) so bubbles
  read as elevated; **inbound bubbles are now white cards** (thin ring +
  calm shadow), outbound stay emerald (the WhatsApp affordance); tinted
  thread-header avatar; **circular emerald send** button.
- **M05B-3 · customer panel** — tinted, ringed contact avatar for
  consistency; the panel keeps its clean sectioned layout (tags · deals ·
  notes).
- **M05B-4 · polish** — AI thread banner retinted to the **reserved indigo
  AI accent** (first real consumer of the `--ai` token — `text-ai` /
  `bg-ai-soft`); fixed the WhatsApp-not-connected banner's amber contrast
  for light mode.

## M05C — what changed (campaign wizard + AI writer)

Restyle + one net-new UI (the AI writer), consuming only existing M04 APIs
— no endpoint, provider, quota, or billing changes.

- **M05C-2 · wizard shell** — the broadcast wizard step content now sits in
  a white **"cockpit" card panel** on the soft-gray canvas; emerald stepper
  inherited from M05A.
- **M05C-3 · insights** — `CampaignInsights` restructured into a labelled
  "Campaign insights" section with gray tiles, a **no-markup** emerald chip,
  and a **colour-coded risk badge** on the quality score. Still read-only /
  deterministic.
- **M05C-4/5 · AI writer** — new `campaigns/ai-writer-panel.tsx` (indigo AI
  accent) plugged into the **template composer** beside the body field via a
  "✨ Write with AI" toggle. Inputs + **en/hi/hinglish** toggle; **Write with
  AI** / **Improve draft**; result preview (message · short version · CTA ·
  variables · approval notes) with **Use this** / **Use short** filling the
  body. Full loading / 402-upgrade / not-configured / generic-retry states.
  Never auto-sends. See [../campaigns/AI_WRITER_UI.md](../campaigns/AI_WRITER_UI.md).

## M05D — what changed (dashboard / analytics)

Restyle only — all data queries, calculations, chart geometry, and route
behavior preserved. Every widget already shared the
`rounded-xl border border-border bg-card` language; the pass adds the M05A
**calm elevation** and tightens colour semantics.

- **M05D-2 · KPI cards** — `MetricCard` gains `shadow-card`; the delta is
  now a **rounded trend pill** (semantic **green up / red down**,
  deliberately decoupled from the brand accent, `-600/-400` for light+dark).
  `SkeletonCard` matches so there's no load-in elevation shift. Quick-action
  tiles get `shadow-card` + a subtle hover lift.
- **M05D-3 · charts** — the three chart cards get `shadow-card`. The
  conversations line chart is recoloured to **emerald (incoming, primary) +
  muted slate (outgoing, secondary)** — was blue/violet — across lines,
  legend, hover dots, and tooltip. Response-time bars → **emerald** (was
  violet). Pipeline donut keeps user-defined stage colours. Gridlines stay
  soft (`var(--border)`).
- **M05D-4 · activity + states** — activity feed gets `shadow-card`; its
  kind badges and the quick-action tints fixed to `-600 dark:-400` so
  amber/blue/rose read on the light canvas.

## M05E — what changed (billing / settings)

Restyle only — all form behavior, validation, submit, `?tab=` routing,
billing/entitlement logic, and Dodo internals preserved. The rail,
panel-head, and overview were already premium (M05A-era redesign), so the
effort concentrated on the billing panel.

- **M05E-2 · overview** — status tiles gain `shadow-card` + a subtle
  hover-lift, matching the dashboard/wizard.
- **M05E-3 · billing** — the M02 "deliberately unpolished" panel got its
  visual pass: a **hero current-plan card** (plan name + soft status pill
  + price), a **usage section with progress bars** (emerald → amber → red
  as usage nears the limit; "Unlimited" renders no bar), and **plan rows**
  with the current plan emerald-highlighted and emerald upgrade CTAs.
  Presentation only — the `/api/billing/*` calls, checkout redirect, and
  admin-gating are unchanged.
- **M05E-4 · other panels** — light-consistency fixes: dark-tuned `-400`
  status colours in `whatsapp-config` and `members-tab` (and a
  destructive-button's `border-red-900`/`bg-red-950`) made theme-aware
  (`-600 dark:-400`) so they read on the light canvas.

## Guardrails (whole milestone)

- No migrations, RLS, WhatsApp send/webhook, billing/AI internals, or route
  contract changes.
- No Drizzle, no Cloudflare, no hardcoded secrets.
- Every checkpoint: `typecheck` · `lint` · `test` · `build` green.

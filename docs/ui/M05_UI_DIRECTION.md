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
| **M05A** | Design tokens + app-shell/primitive foundation | ✅ this pass |
| M05B | Shared inbox redesign (filters · list · thread · customer panel) | ⏳ |
| M05C | Campaign wizard redesign + AI writer composer UI | ⏳ |
| M05D | Dashboard / analytics polish (KPI cards, charts) | ⏳ |
| M05E | Billing / settings polish | ⏳ |
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

## Guardrails (whole milestone)

- No migrations, RLS, WhatsApp send/webhook, billing/AI internals, or route
  contract changes.
- No Drizzle, no Cloudflare, no hardcoded secrets.
- Every checkpoint: `typecheck` · `lint` · `test` · `build` green.

# AI campaign writer — UI (M05C)

The customer-visible UI for the AI campaign writer, built on top of the
existing **`POST /api/ai/campaign`** endpoint (shipped in M04). M05C added
the panel only — **the endpoint, the AI provider path, quota logic, and
billing were not touched.**

## Where it lives

`src/components/campaigns/ai-writer-panel.tsx`, wired into the **template
composer** (`src/components/settings/template-manager.tsx`) beside the
template **body** field — the one place with a real body to fill. A
"✨ Write with AI" toggle on the body label reveals the panel; it stays
hidden by default so it never clutters the form.

> The broadcast wizard *selects* an existing approved template (no
> free-text body), so the writer belongs in the template composer, where
> its output has a destination.

## Visual system

Uses the reserved **indigo AI accent** (`text-ai` / `bg-ai` / `bg-ai-soft`
/ `bg-ai/…`, `text-ai-foreground`), matching the inbox AI banner from
M05B — visually distinct from the emerald brand so "AI" reads as AI, never
as a primary send action.

## Inputs

business type · audience · offer/product/service · goal · tone ·
**language toggle (English / हिंदी / Hinglish)**. Hinglish is a
first-class option for Indian SMBs. Category and the current draft are
passed through from the composer automatically.

## Actions

- **Write with AI** — drafts fresh copy from the brief.
- **Improve draft** — rewrites the current body text (disabled until the
  body has content).

Both call the same endpoint; "Improve" additionally sends the current body
as `existing_draft`.

## Output & "Use this"

The result preview shows: the **suggested message** (with **Use this** →
fills the body, and a copy button), a **shorter version** (**Use short**),
**CTA ideas** (chips), **personalization variables**, and **approval
notes**. Nothing is ever auto-sent — the user explicitly clicks to apply a
suggestion into the body field.

## States

- **Loading** — inline spinner ("Writing your campaign…").
- **402 upgrade-required** (out of AI credits) — an amber card with a
  "View plans" link to `Settings → billing`. Detected via `res.status === 402`.
- **AI not configured** (`code: ai_not_configured`) — a neutral hint to
  enable platform AI / add a key in Settings → AI Assistant.
- **Generic error** — a neutral message with a **Retry** button. Raw
  provider/server detail is **never** surfaced.

## Guardrails honored

- No endpoint / provider / quota / billing changes.
- No auto-send; human review required before use.
- No new dependencies.
- Strings are English, consistent with the M04 campaign UI
  (CampaignInsights). Full i18n for the campaign feature set is a
  documented follow-up.

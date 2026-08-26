'use client';

// ============================================================
// AI campaign writer panel (M05C).
//
// A compact assistant that consumes the existing /api/ai/campaign endpoint
// (built in M04 — NOT modified here) to draft WhatsApp campaign copy, then
// lets the user drop the result into a template body via `onUseMessage`.
//
// Visual system: the reserved INDIGO AI accent (text-ai / bg-ai / bg-ai-soft
// / border-ai), distinct from the emerald brand — matching the inbox AI
// banner from M05B. Never sends; the user reviews before using.
//
// Strings are English (consistent with the M04 campaign UI, e.g.
// CampaignInsights); full i18n for the campaign feature set is a follow-up.
// ============================================================

import { useState } from 'react';
import {
  AlertTriangle,
  ArrowUpRight,
  Check,
  Copy,
  Loader2,
  Sparkles,
  Wand2,
} from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type {
  CampaignLanguage,
  CampaignWriterOutput,
} from '@/lib/ai/campaign';

type TemplateCategory = 'Marketing' | 'Utility' | 'Authentication';

interface AiWriterPanelProps {
  /** Current body text — enables "Improve draft" and is sent as context. */
  existingDraft?: string;
  /** Target template category, if the composer already has one. */
  templateCategory?: TemplateCategory;
  /** Drop a chosen message into the body field. */
  onUseMessage: (text: string) => void;
}

type ErrorKind = 'quota' | 'config' | 'generic' | null;

const LANGUAGES: { value: CampaignLanguage; label: string; hint?: string }[] = [
  { value: 'en', label: 'English' },
  { value: 'hi', label: 'हिंदी' },
  { value: 'hinglish', label: 'Hinglish', hint: 'Roman-script Hindi' },
];

export function AiWriterPanel({
  existingDraft,
  templateCategory,
  onUseMessage,
}: AiWriterPanelProps) {
  const [businessType, setBusinessType] = useState('');
  const [audience, setAudience] = useState('');
  const [offer, setOffer] = useState('');
  const [goal, setGoal] = useState('');
  const [tone, setTone] = useState('');
  const [language, setLanguage] = useState<CampaignLanguage>('en');

  const [loading, setLoading] = useState(false);
  const [errorKind, setErrorKind] = useState<ErrorKind>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [result, setResult] = useState<CampaignWriterOutput | null>(null);
  const [copied, setCopied] = useState(false);

  const hasDraft = !!existingDraft && existingDraft.trim().length > 0;

  async function generate(improve: boolean) {
    setLoading(true);
    setErrorKind(null);
    setErrorMsg('');
    // Keep the previous result visible under the spinner? No — clear it so a
    // stale suggestion can't be mistaken for the new one.
    setResult(null);
    try {
      const res = await fetch('/api/ai/campaign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          business_type: businessType,
          audience,
          offer,
          campaign_goal: goal,
          tone,
          language,
          template_category: templateCategory,
          // "Improve draft" sends the current body as the base to rewrite.
          existing_draft: improve ? existingDraft : undefined,
        }),
      });

      if (res.status === 402) {
        setErrorKind('quota');
        return;
      }
      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as {
          code?: string;
        } | null;
        if (body?.code === 'ai_not_configured') {
          setErrorKind('config');
        } else {
          setErrorKind('generic');
          // Deliberately generic — never surface raw provider/server detail.
          setErrorMsg('Something went wrong while writing. Please try again.');
        }
        return;
      }

      const data = (await res.json()) as CampaignWriterOutput;
      setResult(data);
    } catch {
      setErrorKind('generic');
      setErrorMsg('Could not reach the AI service. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  function applyMessage(text: string) {
    if (!text.trim()) return;
    onUseMessage(text);
    toast.success('Added to the message body');
  }

  async function copyMessage(text: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard can be blocked; the "Use this" button is the primary path.
    }
  }

  return (
    <div className="rounded-xl border border-ai/25 bg-ai-soft p-4">
      {/* Header */}
      <div className="flex items-center gap-2">
        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-ai/15 text-ai">
          <Sparkles className="h-4 w-4" />
        </span>
        <div>
          <p className="text-sm font-semibold text-foreground">AI campaign writer</p>
          <p className="text-[11px] text-muted-foreground">
            Draft WhatsApp copy — you review before using. Nothing is sent.
          </p>
        </div>
      </div>

      {/* Inputs */}
      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        <Input
          value={businessType}
          onChange={(e) => setBusinessType(e.target.value)}
          placeholder="Business type (e.g. sari shop)"
          className="h-8 bg-card text-sm"
        />
        <Input
          value={audience}
          onChange={(e) => setAudience(e.target.value)}
          placeholder="Audience (e.g. repeat customers)"
          className="h-8 bg-card text-sm"
        />
        <Input
          value={offer}
          onChange={(e) => setOffer(e.target.value)}
          placeholder="Offer / product / service"
          className="h-8 bg-card text-sm sm:col-span-2"
        />
        <Input
          value={goal}
          onChange={(e) => setGoal(e.target.value)}
          placeholder="Goal (e.g. drive weekend footfall)"
          className="h-8 bg-card text-sm"
        />
        <Input
          value={tone}
          onChange={(e) => setTone(e.target.value)}
          placeholder="Tone (e.g. warm, festive)"
          className="h-8 bg-card text-sm"
        />
      </div>

      {/* Language toggle — Hinglish matters for Indian SMBs. */}
      <div className="mt-3">
        <p className="mb-1 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
          Language
        </p>
        <div className="inline-flex rounded-lg border border-border bg-card p-0.5">
          {LANGUAGES.map((l) => (
            <button
              key={l.value}
              type="button"
              onClick={() => setLanguage(l.value)}
              title={l.hint}
              className={cn(
                'rounded-md px-3 py-1 text-xs font-medium transition-colors',
                language === l.value
                  ? 'bg-ai text-ai-foreground'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              {l.label}
            </button>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="mt-3 flex flex-wrap gap-2">
        <Button
          type="button"
          size="sm"
          onClick={() => generate(false)}
          disabled={loading}
          className="bg-ai text-ai-foreground hover:bg-ai/90"
        >
          {loading ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Wand2 className="h-3.5 w-3.5" />
          )}
          Write with AI
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => generate(true)}
          disabled={loading || !hasDraft}
          title={hasDraft ? undefined : 'Add some body text first to improve it'}
        >
          <Sparkles className="h-3.5 w-3.5" />
          Improve draft
        </Button>
      </div>

      {/* Loading */}
      {loading && (
        <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
          <Loader2 className="h-3.5 w-3.5 animate-spin text-ai" />
          Writing your campaign…
        </div>
      )}

      {/* Error / upgrade states */}
      {!loading && errorKind === 'quota' && (
        <div className="mt-3 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-xs">
          <p className="flex items-center gap-1.5 font-medium text-amber-700 dark:text-amber-300">
            <AlertTriangle className="h-3.5 w-3.5" />
            You&apos;re out of AI credits this month
          </p>
          <p className="mt-1 text-muted-foreground">
            Upgrade your plan to keep using the AI writer.
          </p>
          <Link
            href="/settings?tab=billing"
            className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-ai hover:underline"
          >
            View plans <ArrowUpRight className="h-3 w-3" />
          </Link>
        </div>
      )}
      {!loading && errorKind === 'config' && (
        <div className="mt-3 rounded-lg border border-border bg-muted/50 p-3 text-xs text-muted-foreground">
          AI isn&apos;t set up yet. An admin can enable platform AI or add a key
          under Settings → AI Assistant.
        </div>
      )}
      {!loading && errorKind === 'generic' && (
        <div className="mt-3 flex items-center justify-between gap-2 rounded-lg border border-border bg-muted/50 p-3 text-xs text-muted-foreground">
          <span>{errorMsg}</span>
          <Button
            type="button"
            size="xs"
            variant="ghost"
            onClick={() => generate(false)}
          >
            Retry
          </Button>
        </div>
      )}

      {/* Result preview */}
      {!loading && result && (
        <div className="mt-3 space-y-3 border-t border-ai/20 pt-3">
          {/* Main message */}
          <div className="rounded-lg border border-border bg-card p-3">
            <div className="mb-1.5 flex items-center justify-between">
              <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                Suggested message
              </span>
              <div className="flex items-center gap-1">
                <Button
                  type="button"
                  size="xs"
                  variant="ghost"
                  onClick={() => copyMessage(result.message)}
                  title="Copy"
                >
                  {copied ? (
                    <Check className="h-3 w-3 text-emerald-500" />
                  ) : (
                    <Copy className="h-3 w-3" />
                  )}
                </Button>
                <Button
                  type="button"
                  size="xs"
                  onClick={() => applyMessage(result.message)}
                  className="bg-ai text-ai-foreground hover:bg-ai/90"
                >
                  Use this
                </Button>
              </div>
            </div>
            <p className="whitespace-pre-wrap break-words text-sm text-foreground">
              {result.message}
            </p>
          </div>

          {/* Short version */}
          {result.short_version && (
            <div className="rounded-lg border border-border bg-card p-3">
              <div className="mb-1.5 flex items-center justify-between">
                <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  Shorter version
                </span>
                <Button
                  type="button"
                  size="xs"
                  variant="outline"
                  onClick={() => applyMessage(result.short_version)}
                >
                  Use short
                </Button>
              </div>
              <p className="whitespace-pre-wrap break-words text-sm text-foreground">
                {result.short_version}
              </p>
            </div>
          )}

          {/* CTA suggestions */}
          {result.cta_suggestions.length > 0 && (
            <div>
              <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                CTA ideas
              </p>
              <div className="flex flex-wrap gap-1.5">
                {result.cta_suggestions.map((cta, i) => (
                  <span
                    key={i}
                    className="rounded-full bg-ai/10 px-2 py-0.5 text-[11px] text-ai"
                  >
                    {cta}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Variable suggestions */}
          {result.variable_suggestions.length > 0 && (
            <div>
              <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                Personalization variables
              </p>
              <ul className="space-y-0.5">
                {result.variable_suggestions.map((v, i) => (
                  <li key={i} className="text-xs text-muted-foreground">
                    • {v}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Compliance notes */}
          {result.compliance_notes.length > 0 && (
            <div className="rounded-lg border border-amber-500/25 bg-amber-500/5 p-2.5">
              <p className="mb-1 flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wide text-amber-700 dark:text-amber-300">
                <AlertTriangle className="h-3 w-3" />
                Approval notes
              </p>
              <ul className="space-y-0.5">
                {result.compliance_notes.map((n, i) => (
                  <li key={i} className="text-xs text-muted-foreground">
                    • {n}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

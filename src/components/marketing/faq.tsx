import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from '@/components/ui/accordion';
import { Section, SectionHeader } from './section';

const FAQS: { q: string; a: string }[] = [
  {
    q: 'Do I need a WhatsApp Business account?',
    a: 'Yes. You connect your own WhatsApp Business number through the official WhatsApp Business API — the platform doesn’t message on an unofficial or unverified channel.',
  },
  {
    q: 'Can my team share one inbox?',
    a: 'Yes. Every conversation lands in a shared inbox your team can assign, reply to, and mark resolved together, with roles controlling who can do what.',
  },
  {
    q: 'Can AI send messages automatically?',
    a: 'No. The AI campaign writer drafts and improves messages for you to review — it does not send campaigns or replies on its own.',
  },
  {
    q: 'Does it support Hindi/Hinglish?',
    a: 'Yes, for AI-assisted campaign writing — it can draft in English, हिंदी, or Hinglish. The app’s own interface is English-first today.',
  },
  {
    q: 'How are campaign costs estimated?',
    a: 'The estimator uses the currently configured WhatsApp per-message rate card by category (Marketing, Utility, Authentication), your recipient count, and a delivery assumption, then shows the math — not just a final number. Meta sets and can change these rates, so figures are estimates, not locked-in quotes.',
  },
  {
    q: 'Are WhatsApp charges included in the plan price?',
    a: 'No. The platform fee covers the software. WhatsApp/Meta’s own per-message charges are separate and shown to you as part of the cost estimate.',
  },
  {
    q: 'Can I import contacts?',
    a: 'Yes — import a CSV or add contacts individually, then organize them with tags and custom fields.',
  },
  {
    q: 'Is this built for India only?',
    a: 'It’s India-first — INR pricing and Hindi/Hinglish writing are built in — but the underlying WhatsApp workflow isn’t geographically limited.',
  },
  {
    q: 'Can I start free?',
    a: 'Yes. The Free plan is enough to connect WhatsApp, add contacts, and run your first campaigns before you decide whether to upgrade.',
  },
];

export function FAQ() {
  return (
    <Section id="faq" tone="muted">
      <SectionHeader eyebrow="FAQ" title="Questions worth answering upfront." align="center" />
      <div className="mx-auto mt-12 max-w-2xl">
        <Accordion>
          {FAQS.map((item, i) => (
            <AccordionItem key={item.q} value={String(i)}>
              <AccordionTrigger className="text-[15px] text-foreground">
                {item.q}
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                {item.a}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </Section>
  );
}

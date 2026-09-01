import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from '@/components/ui/accordion';
import { Band, Inner, Eyebrow, Heading } from './section';
import { Reveal } from './reveal';

const FAQS: { q: string; a: string }[] = [
  {
    q: 'Do I need a WhatsApp Business account?',
    a: 'Yes. You connect your own WhatsApp Business number through the official WhatsApp Business API — this does not message on an unofficial or unverified channel.',
  },
  {
    q: 'Can my team share one inbox?',
    a: 'Yes. Every conversation lands in a shared inbox your team can assign, reply to and resolve together, with roles controlling who can do what.',
  },
  {
    q: 'Can AI send messages automatically?',
    a: 'No. The AI campaign writer drafts and rewrites messages for you to review. It cannot send a campaign or a reply, and there is no setting that enables it to.',
  },
  {
    q: 'Does it support Hindi and Hinglish?',
    a: 'For AI-assisted campaign writing, yes — it drafts in English, हिंदी or Hinglish. The app’s own interface is English-first today.',
  },
  {
    q: 'How are campaign costs estimated?',
    a: 'From the configured WhatsApp per-message rate card for the template’s category, your recipient count, and a stated delivery assumption — and the app shows that working rather than only the total. Meta sets and can change these rates, so a figure is an estimate, not a locked quote.',
  },
  {
    q: 'Are WhatsApp charges included in the plan price?',
    a: 'No. The platform fee covers the software. WhatsApp/Meta’s per-message charges are separate and are surfaced to you as part of the cost estimate.',
  },
  {
    q: 'Can I import contacts?',
    a: 'Yes — import a CSV or add contacts individually, then organise them with tags and custom fields for targeting later.',
  },
  {
    q: 'Is this built for India only?',
    a: 'It is India-first — INR pricing and Hindi/Hinglish drafting are built in — but the underlying WhatsApp workflow is not geographically limited.',
  },
  {
    q: 'Can I start free?',
    a: 'Yes. The Free plan is enough to connect WhatsApp, add contacts and run your first campaigns before deciding whether to upgrade. No card is required.',
  },
];

export function FAQ() {
  return (
    <Band id="faq" tone="raised">
      <Inner>
        <div className="grid gap-y-10 lg:grid-cols-12 lg:gap-x-16">
          {/* Pinned while the questions scroll past — the heading keeps
              company with the list instead of leaving a tall void beside
              it. */}
          {/* The sticky wrapper is deliberately outside `Reveal`: the
              reveal animates `transform`, and an element with a
              transform establishes a containing block that would break
              position: sticky. */}
          <div className="lg:col-span-4 lg:sticky lg:top-28 lg:self-start">
            <Reveal>
              <Eyebrow>FAQ</Eyebrow>
              <Heading className="mt-5" size="sm">
                Questions worth answering upfront.
              </Heading>
            </Reveal>
          </div>

          <Reveal delay={100} className="lg:col-span-7 lg:col-start-6">
            <Accordion className="border-t border-border">
              {FAQS.map((item, i) => (
                <AccordionItem key={item.q} value={String(i)} className="border-b border-border">
                  <AccordionTrigger className="py-5 text-[15px] font-medium text-foreground hover:no-underline">
                    {item.q}
                  </AccordionTrigger>
                  <AccordionContent className="max-w-[62ch] pb-5 text-[13.5px] leading-[1.7] text-muted-foreground">
                    {item.a}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </Reveal>
        </div>
      </Inner>
    </Band>
  );
}

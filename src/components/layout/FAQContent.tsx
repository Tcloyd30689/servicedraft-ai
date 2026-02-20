'use client';

const faqs = [
  {
    question: 'What is ServiceDraft.AI?',
    answer:
      'ServiceDraft.AI is an AI-powered tool that transforms your technician notes into professional, audit-proof warranty narratives in the industry-standard 3C format (Concern, Cause, Correction).',
  },
  {
    question: 'How do I generate a narrative?',
    answer:
      'Click "Generate New Story" from the main menu, select your story type (Diagnostic Only or Repair Complete), fill in the required fields, and click "Generate Story". The AI will create a professional narrative based on your input.',
  },
  {
    question: 'What is the difference between Diagnostic Only and Repair Complete?',
    answer:
      'Diagnostic Only is for work orders where only the diagnosis was performed. Repair Complete is for work orders where the full repair has been completed. Each type has different fields and generates a different narrative structure.',
  },
  {
    question: 'What do the conditional field options mean?',
    answer:
      '"Include Information" means you will provide the data. "Don\'t Include" skips the field entirely. "Generate Applicable Info" lets the AI infer appropriate content based on the other information you provided.',
  },
  {
    question: 'Can I edit the generated narrative?',
    answer:
      'Yes! Use the "Edit Story" button to manually modify the text. You can also use the AI Customization panel to adjust length, tone, and detail level.',
  },
  {
    question: 'Are saved narratives editable?',
    answer:
      'No. Once saved, narratives are read-only to maintain audit integrity. You can always generate a new narrative if changes are needed.',
  },
  {
    question: 'What does the Review & Proofread feature do?',
    answer:
      'It sends your current narrative through a separate AI audit that checks for potential warranty audit flags, suggests improvements, and provides an overall quality rating (Pass, Needs Review, or Fail).',
  },
];

export default function FAQContent() {
  return (
    <div className="space-y-5 max-h-[60vh] overflow-y-auto pr-2">
      {faqs.map((faq, i) => (
        <div key={i}>
          <h3 className="text-[var(--accent-hover)] text-sm font-semibold mb-1">
            {faq.question}
          </h3>
          <p className="text-[var(--text-secondary)] text-sm leading-relaxed">
            {faq.answer}
          </p>
        </div>
      ))}
    </div>
  );
}

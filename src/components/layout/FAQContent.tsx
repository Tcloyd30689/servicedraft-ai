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
  {
    question: 'What are Repair Templates?',
    answer:
      'Repair Templates are reusable templates for common repairs you perform frequently. You can save the core repair fields (codes, diagnostics, root cause, repair performed, and verification) from any completed narrative, then load them later to quickly pre-fill the input form for similar jobs.',
  },
  {
    question: 'How does AI Customization work?',
    answer:
      'The AI Customization panel lets you adjust your narrative using sliders for length, tone, and detail level. Each slider has three positions (e.g., Concise / Standard / Detailed) that modify how the AI rewrites your narrative. You can fine-tune the output to match your shop\'s documentation style.',
  },
  {
    question: 'What is the Review & Proofread audit rating?',
    answer:
      'The audit rating is a quality score assigned by the AI after reviewing your narrative. "Pass" means the narrative is audit-ready with no major concerns. "Needs Review" means there are minor issues or suggestions worth addressing. "Fail" means significant problems were found that should be corrected before submission.',
  },
  {
    question: 'Can I export my narratives?',
    answer:
      'Yes! ServiceDraft.AI supports multiple export options: Copy to Clipboard for quick pasting, Print for direct printing, and Download as PDF or Download as Word Document (.docx) for professional formatted files with your vehicle info and repair order number.',
  },
  {
    question: 'Is my data secure?',
    answer:
      'Yes. All data is stored securely using Supabase with row-level security (RLS), meaning users can only access their own narratives and profile information. Your data is never sold or shared with third parties.',
  },
  {
    question: 'What does "Generate Applicable Info" do?',
    answer:
      'When you select "Generate Applicable Info" for a conditional field, the AI will infer the most probable content for that field based on the other information you\'ve provided (customer concern, diagnostics, etc.). This is useful when a technician didn\'t document a specific detail but the AI can reasonably determine it from context.',
  },
  {
    question: 'How do I contact support?',
    answer:
      'You can reach our support team by clicking the "Support" button on the main menu, which opens a contact form. You can also email us directly at support@servicedraft.ai.',
  },
  {
    question: 'Can I use ServiceDraft.AI on my phone?',
    answer:
      'Yes! ServiceDraft.AI is fully responsive and works on mobile devices, tablets, and desktops. For the best experience on mobile, we recommend using Chrome or Safari.',
  },
];

export default function FAQContent() {
  return (
    <div className="space-y-5 max-h-[60vh] overflow-y-auto pr-2">
      {faqs.map((faq, i) => (
        <div key={i}>
          <h3 className="text-[var(--accent-text-emphasis)] text-sm font-semibold mb-1" style={{ fontWeight: 'var(--accent-text-emphasis-weight)' as unknown as number }}>
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

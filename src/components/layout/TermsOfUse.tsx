'use client';

const sections = [
  {
    heading: '1. Acceptance of Terms',
    content:
      'By accessing or using ServiceDraft.AI, you agree to be bound by these Terms of Use. If you do not agree to these terms, you may not use the platform. Your continued use of the service constitutes acceptance of any updates or modifications to these terms.',
  },
  {
    heading: '2. Service Description',
    content:
      'ServiceDraft.AI is an AI-powered writing assistance tool designed to help automotive service professionals generate warranty repair narratives. The platform provides AI-generated suggestions to streamline documentation workflows. ServiceDraft.AI is not a substitute for professional judgment, and all generated content should be reviewed by qualified personnel before submission.',
  },
  {
    heading: '3. User Responsibilities',
    content:
      'You are responsible for verifying the accuracy of all generated narratives before use. You agree not to submit false, misleading, or fabricated information through the platform. You must comply with your employer\'s policies and all applicable industry regulations when using generated content. ServiceDraft.AI is a tool to assist your work — final responsibility for submitted documentation rests with you.',
  },
  {
    heading: '4. AI-Generated Content Disclaimer',
    content:
      'All narratives and suggestions produced by ServiceDraft.AI are AI-generated and provided as suggestions only. While the platform is designed to produce professional, audit-conscious content, there is no guarantee that generated narratives will pass any specific warranty audit or meet the requirements of any particular manufacturer or regulatory body. You should always review and edit generated content as needed.',
  },
  {
    heading: '5. Account Terms',
    content:
      'Each account is intended for use by a single individual. You are responsible for maintaining the confidentiality of your login credentials and for all activity that occurs under your account. You agree to notify us immediately of any unauthorized use of your account.',
  },
  {
    heading: '6. Subscription & Billing',
    content:
      'Access to ServiceDraft.AI requires an active subscription or a valid access code. Subscription terms, pricing, and billing cycles are presented at the time of purchase. Failure to maintain an active subscription may result in restricted access to platform features.',
  },
  {
    heading: '7. Intellectual Property',
    content:
      'Narratives and content you generate using ServiceDraft.AI belong to you. The ServiceDraft.AI platform, including its design, code, AI models, prompts, branding, and all associated intellectual property, is owned by ServiceDraft.AI and its creators. You may not copy, reverse-engineer, or redistribute any part of the platform.',
  },
  {
    heading: '8. Data Privacy',
    content:
      'Your data is stored securely using industry-standard practices including row-level security and encrypted connections. We do not sell, share, or distribute your personal information or generated content to third parties. You may request deletion of your account and associated data by contacting our support team.',
  },
  {
    heading: '9. Limitation of Liability',
    content:
      'ServiceDraft.AI is provided on an "as-is" basis without warranties of any kind, express or implied. We are not liable for any damages resulting from the use of generated narratives, including but not limited to warranty claim denials, audit failures, or financial losses. Use of the platform is at your own risk.',
  },
  {
    heading: '10. Modifications to Terms',
    content:
      'We reserve the right to update or modify these Terms of Use at any time. Changes will be reflected by an updated "Last Updated" date on this page. Your continued use of ServiceDraft.AI after any modifications constitutes acceptance of the revised terms.',
  },
  {
    heading: '11. Termination',
    content:
      'Either party may terminate this agreement at any time. You may stop using the service and request account deletion. We reserve the right to suspend or terminate your account for violations of these terms. Upon termination, your data will be retained for 30 days before permanent deletion, during which time you may request a copy by contacting support.',
  },
];

export default function TermsOfUse() {
  return (
    <div className="space-y-5 max-h-[70vh] overflow-y-auto pr-2">
      <p className="text-[var(--text-muted)] text-xs">
        Last Updated: March 2026
      </p>

      {sections.map((section, i) => (
        <div key={i}>
          <h3
            className="text-[var(--accent-text-emphasis)] text-sm font-semibold mb-1"
            style={{ fontWeight: 'var(--accent-text-emphasis-weight)' as unknown as number }}
          >
            {section.heading}
          </h3>
          <p className="text-[var(--text-secondary)] text-sm leading-relaxed">
            {section.content}
          </p>
        </div>
      ))}
    </div>
  );
}

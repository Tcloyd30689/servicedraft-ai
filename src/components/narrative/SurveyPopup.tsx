'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import toast from 'react-hot-toast';
import LiquidCard from '@/components/ui/LiquidCard';

export interface SurveyQuestion {
  id: string;
  question_text: string;
  input_type: string;
  options: string[] | null;
}

interface SurveyPopupProps {
  question: SurveyQuestion | null;
  onClose: () => void;
}

/** The API rejects response_value longer than this. */
const MAX_RESPONSE_LENGTH = 1000;

/**
 * Sits above page content and the nav (z 100/110) but BELOW modals (z 200+),
 * so the unsaved-navigation guard still stacks over it, and far below the
 * react-hot-toast container so toasts always win.
 */
const POPUP_Z_INDEX = 150;

/**
 * A compact, non-blocking bottom-right survey prompt.
 *
 * Deliberately NOT a modal: no backdrop, no focus trap, no scroll lock. It must
 * never interrupt the user's workflow, and it is SILENT on every API failure —
 * a failed submit or dismiss closes the popup and logs to the console only.
 */
export default function SurveyPopup({ question, onClose }: SurveyPopupProps) {
  const [textValue, setTextValue] = useState('');
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Anything that isn't a well-formed choice question falls back to free text.
  const choiceOptions =
    question?.input_type === 'choice' &&
    Array.isArray(question.options) &&
    question.options.length > 0
      ? question.options
      : null;

  const submitDisabled = isSubmitting || (choiceOptions !== null && !selectedOption);

  /**
   * Fire the response at the API. NEVER throws — returns false on any failure so
   * the caller can close the popup regardless.
   */
  const postResponse = async (payload: {
    survey_id: string;
    response_value?: string;
    was_dismissed?: boolean;
  }): Promise<boolean> => {
    try {
      const response = await fetch('/api/surveys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const body = await response.json().catch(() => null);
        throw new Error(body?.error || `Survey response failed (${response.status})`);
      }

      return true;
    } catch (err) {
      // Silent by design — the popup is polite and never shows an error UI.
      console.error('Survey response failed:', err);
      return false;
    }
  };

  const handleSubmit = async () => {
    if (!question || submitDisabled) return;

    const value = choiceOptions !== null ? (selectedOption ?? '') : textValue.trim();

    setIsSubmitting(true);
    const ok = await postResponse({
      survey_id: question.id,
      response_value: value.slice(0, MAX_RESPONSE_LENGTH),
    });
    setIsSubmitting(false);

    if (ok) {
      toast.success('Thanks for your feedback', { id: 'survey-response' });
    }
    onClose();
  };

  const handleDismiss = () => {
    if (!question) return;

    const surveyId = question.id;
    // Close instantly — a dismissal should never wait on the network.
    onClose();
    void postResponse({ survey_id: surveyId, was_dismissed: true });
  };

  return (
    <AnimatePresence>
      {question && (
        <motion.div
          key={question.id}
          initial={{ opacity: 0, y: 24, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 24, scale: 0.96 }}
          transition={{ duration: 0.22, ease: 'easeOut' }}
          className="fixed bottom-4 right-4 w-[calc(100vw-2rem)] max-w-sm"
          style={{ zIndex: POPUP_Z_INDEX }}
          role="dialog"
          aria-label="Quick survey"
        >
          <LiquidCard size="compact">
            <div className="flex items-start gap-3">
              <p
                className="flex-1 text-sm font-medium leading-snug"
                style={{ color: 'var(--text-primary)' }}
              >
                {question.question_text}
              </p>

              <motion.button
                type="button"
                onClick={handleDismiss}
                title="Dismiss"
                aria-label="Dismiss survey"
                whileHover={{ scale: 1.12 }}
                whileTap={{ scale: 0.94 }}
                className="shrink-0 flex items-center justify-center h-7 w-7 rounded-full cursor-pointer"
                style={{
                  color: 'var(--text-muted)',
                  backgroundColor: 'var(--accent-10)',
                }}
              >
                <X size={14} />
              </motion.button>
            </div>

            {choiceOptions ? (
              <div className="mt-3 flex flex-wrap gap-2">
                {choiceOptions.map((option) => {
                  const isSelected = selectedOption === option;
                  return (
                    <motion.button
                      key={option}
                      type="button"
                      onClick={() => setSelectedOption(option)}
                      disabled={isSubmitting}
                      aria-pressed={isSelected}
                      whileHover={isSubmitting ? undefined : { scale: 1.04 }}
                      whileTap={isSubmitting ? undefined : { scale: 0.97 }}
                      className="text-xs font-medium px-3 py-1.5 rounded-lg border cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                      style={{
                        color: isSelected ? 'var(--accent-bright)' : 'var(--text-secondary)',
                        backgroundColor: isSelected ? 'var(--accent-20)' : 'var(--accent-10)',
                        borderColor: isSelected ? 'var(--accent-border)' : 'var(--accent-15)',
                        boxShadow: isSelected ? 'var(--shadow-glow-sm)' : 'none',
                      }}
                    >
                      {option}
                    </motion.button>
                  );
                })}
              </div>
            ) : (
              <div className="mt-3">
                <textarea
                  value={textValue}
                  onChange={(e) => setTextValue(e.target.value)}
                  maxLength={MAX_RESPONSE_LENGTH}
                  rows={2}
                  disabled={isSubmitting}
                  placeholder="Your answer"
                  aria-label="Your answer"
                  className="w-full rounded-lg px-3 py-2 text-sm resize-none border focus:outline-none disabled:opacity-50"
                  style={{
                    backgroundColor: 'var(--bg-input)',
                    borderColor: 'var(--accent-border)',
                    color: 'var(--text-primary)',
                  }}
                />
                <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
                  {textValue.length}/{MAX_RESPONSE_LENGTH}
                </span>
              </div>
            )}

            <div className="mt-3 flex justify-end">
              <motion.button
                type="button"
                onClick={handleSubmit}
                disabled={submitDisabled}
                title="Submit"
                aria-label="Submit survey response"
                whileHover={
                  submitDisabled ? undefined : { scale: 1.05, boxShadow: 'var(--shadow-glow-sm)' }
                }
                whileTap={submitDisabled ? undefined : { scale: 0.97 }}
                className="text-xs font-semibold px-4 py-1.5 rounded-lg cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  color: 'var(--btn-text-on-accent)',
                  backgroundColor: 'var(--accent-hover)',
                }}
              >
                {isSubmitting ? 'Sending…' : 'Submit'}
              </motion.button>
            </div>
          </LiquidCard>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ThumbsUp, ThumbsDown, Check } from 'lucide-react';
import toast from 'react-hot-toast';

interface NarrativeFeedbackProps {
  trackerId: string | null;
  storyType: string | null;
  narrativeStyle: string | null;
}

type Rating = 'up' | 'down';

const MAX_COMMENT_LENGTH = 500;

/**
 * Vertical "Was this helpful?" panel. Designed to live in its own narrow
 * LiquidCard beside the narrative (~220-260px on desktop, full width on
 * mobile): prompt line, two large thumbs, then the optional thumbs-down
 * comment box and SUBMIT.
 */
export function NarrativeFeedback({
  trackerId,
  storyType,
  narrativeStyle,
}: NarrativeFeedbackProps) {
  const [rating, setRating] = useState<Rating | null>(null);
  const [showComment, setShowComment] = useState(false);
  const [comment, setComment] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const isDisabled = !trackerId || isSaving;

  // A feedback failure must never throw into the page — it toasts and logs.
  const sendFeedback = async (nextRating: Rating, nextComment?: string): Promise<boolean> => {
    if (!trackerId) return false;

    const trimmedComment = nextComment?.trim() ?? '';

    setIsSaving(true);
    try {
      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tracker_id: trackerId,
          rating: nextRating,
          comment: trimmedComment.length > 0 ? trimmedComment : null,
          story_type: storyType,
          narrative_style: narrativeStyle,
        }),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        throw new Error(payload?.error || 'Failed to save feedback');
      }

      setSaved(true);
      toast.success('Thanks for the feedback', { id: 'narrative-feedback' });
      return true;
    } catch (err) {
      console.error('Narrative feedback save failed:', err);
      toast.error('Could not save your feedback', { id: 'narrative-feedback' });
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  const handleVote = async (nextRating: Rating) => {
    if (isDisabled) return;

    setRating(nextRating);
    // Thumbs down opens the optional comment box; thumbs up collapses it.
    setShowComment(nextRating === 'down');
    if (nextRating === 'up') setComment('');

    // Fire immediately so the rating is captured even if no comment follows.
    await sendFeedback(nextRating);
  };

  const handleSubmitComment = async () => {
    if (isDisabled) return;

    const ok = await sendFeedback('down', comment);
    if (ok) setShowComment(false);
  };

  const thumbStyle = (isActive: boolean) => ({
    color: isActive ? 'var(--accent-bright)' : 'var(--text-muted)',
    backgroundColor: isActive ? 'var(--accent-20)' : 'var(--accent-10)',
    borderColor: isActive ? 'var(--accent-bright)' : 'var(--accent-border)',
    boxShadow: isActive ? 'var(--shadow-glow-sm)' : 'none',
  });

  // Kept small so a full-width button never pushes past the card edge.
  const hoverMotion = isDisabled
    ? undefined
    : { scale: 1.03, boxShadow: '0 0 14px 2px var(--accent-bright)' };
  const tapMotion = isDisabled ? undefined : { scale: 0.98 };

  const thumbButtonClass =
    'flex items-center justify-center w-full min-w-[56px] min-h-[56px] rounded-xl border disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-1 focus-visible:ring-[var(--accent-bright)]';

  return (
    <div className="flex flex-col gap-3 w-full min-w-0">
      <p
        className="text-sm font-medium"
        style={{ color: 'var(--text-secondary)' }}
      >
        Was this helpful?
      </p>

      {/* Two large thumbs side by side; auto-fit stacks them when the card is too narrow. */}
      <div
        className="grid gap-2 w-full"
        style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(72px, 1fr))' }}
      >
        <motion.button
          type="button"
          onClick={() => handleVote('up')}
          disabled={isDisabled}
          title="Helpful"
          aria-label="Helpful"
          aria-pressed={rating === 'up'}
          whileHover={hoverMotion}
          whileTap={tapMotion}
          className={thumbButtonClass}
          style={thumbStyle(rating === 'up')}
        >
          <ThumbsUp size={28} fill={rating === 'up' ? 'currentColor' : 'none'} aria-hidden="true" />
        </motion.button>

        <motion.button
          type="button"
          onClick={() => handleVote('down')}
          disabled={isDisabled}
          title="Not helpful"
          aria-label="Not helpful"
          aria-pressed={rating === 'down'}
          whileHover={hoverMotion}
          whileTap={tapMotion}
          className={thumbButtonClass}
          style={thumbStyle(rating === 'down')}
        >
          <ThumbsDown size={28} fill={rating === 'down' ? 'currentColor' : 'none'} aria-hidden="true" />
        </motion.button>
      </div>

      {saved && !isSaving && (
        <div
          className="flex items-center gap-1.5 text-xs"
          style={{ color: 'var(--accent-bright)' }}
          role="status"
        >
          <Check size={14} aria-hidden="true" />
          <span>Feedback saved</span>
        </div>
      )}

      <AnimatePresence initial={false}>
        {showComment && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.18 }}
            className="overflow-hidden"
          >
            <div className="flex flex-col gap-1.5 w-full min-w-0">
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                maxLength={MAX_COMMENT_LENGTH}
                rows={3}
                placeholder="What was wrong? (optional)"
                aria-label="Feedback comment"
                className="w-full min-w-0 rounded-lg px-3 py-2 text-sm resize-none border focus:outline-none"
                style={{
                  backgroundColor: 'var(--bg-input)',
                  borderColor: 'var(--accent-border)',
                  color: 'var(--text-primary)',
                }}
              />
              <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] shrink-0" style={{ color: 'var(--text-muted)' }}>
                  {comment.length}/{MAX_COMMENT_LENGTH}
                </span>
                <motion.button
                  type="button"
                  onClick={handleSubmitComment}
                  disabled={isDisabled}
                  title="Submit feedback"
                  aria-label="Submit feedback"
                  whileHover={isDisabled ? undefined : { scale: 1.03, boxShadow: 'var(--shadow-glow-sm)' }}
                  whileTap={isDisabled ? undefined : { scale: 0.97 }}
                  className="text-xs font-medium tracking-wide px-3 py-1.5 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{
                    color: 'var(--btn-text-on-accent)',
                    backgroundColor: 'var(--accent-hover)',
                  }}
                >
                  SUBMIT
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

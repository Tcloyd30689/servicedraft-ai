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
    boxShadow: isActive ? 'var(--shadow-glow-sm)' : 'none',
  });

  const hoverMotion = isDisabled
    ? undefined
    : { scale: 1.12, boxShadow: '0 0 14px 2px var(--accent-bright)' };
  const tapMotion = isDisabled ? undefined : { scale: 1.04 };

  return (
    <div className="mt-3">
      <div className="flex items-center gap-2">
        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
          Was this helpful?
        </span>

        <motion.button
          type="button"
          onClick={() => handleVote('up')}
          disabled={isDisabled}
          title="Helpful"
          aria-label="Helpful"
          aria-pressed={rating === 'up'}
          whileHover={hoverMotion}
          whileTap={tapMotion}
          className="shrink-0 flex items-center justify-center h-9 w-9 rounded-full disabled:opacity-50 disabled:cursor-not-allowed"
          style={thumbStyle(rating === 'up')}
        >
          <ThumbsUp size={16} fill={rating === 'up' ? 'currentColor' : 'none'} />
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
          className="shrink-0 flex items-center justify-center h-9 w-9 rounded-full disabled:opacity-50 disabled:cursor-not-allowed"
          style={thumbStyle(rating === 'down')}
        >
          <ThumbsDown size={16} fill={rating === 'down' ? 'currentColor' : 'none'} />
        </motion.button>

        {saved && !isSaving && (
          <Check size={14} style={{ color: 'var(--accent-bright)' }} aria-hidden="true" />
        )}
      </div>

      <AnimatePresence initial={false}>
        {showComment && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.18 }}
            className="overflow-hidden"
          >
            <div className="mt-2 max-w-md">
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                maxLength={MAX_COMMENT_LENGTH}
                rows={2}
                placeholder="What was wrong? (optional)"
                className="w-full rounded-lg px-3 py-2 text-sm resize-none border focus:outline-none"
                style={{
                  backgroundColor: 'var(--bg-input)',
                  borderColor: 'var(--accent-border)',
                  color: 'var(--text-primary)',
                }}
              />
              <div className="flex items-center justify-between mt-1.5">
                <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
                  {comment.length}/{MAX_COMMENT_LENGTH}
                </span>
                <motion.button
                  type="button"
                  onClick={handleSubmitComment}
                  disabled={isDisabled}
                  title="Submit feedback"
                  aria-label="Submit feedback"
                  whileHover={isDisabled ? undefined : { scale: 1.05, boxShadow: 'var(--shadow-glow-sm)' }}
                  whileTap={isDisabled ? undefined : { scale: 0.97 }}
                  className="text-xs font-medium px-3 py-1.5 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{
                    color: 'var(--btn-text-on-accent)',
                    backgroundColor: 'var(--accent-hover)',
                  }}
                >
                  Submit
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

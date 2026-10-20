'use client';

import { motion } from 'framer-motion';
import { ThumbsUp, ThumbsDown } from 'lucide-react';

export type SuggestionRating = 'up' | 'down';

interface ProofreadSuggestionFeedbackProps {
  /** 0-based index of the suggestion this pair of thumbs belongs to. */
  index: number;
  rating: SuggestionRating | null;
  disabled?: boolean;
  onVote: (index: number, rating: SuggestionRating) => void;
}

/**
 * Compact thumbs-up / thumbs-down pair rendered beside ONE suggested edit in
 * the Review & Proofread results. Visual idiom mirrors NarrativeFeedback
 * (secondary color at rest, accent + filled icon when selected) at a smaller
 * ~28px hit area. It lives OUTSIDE the suggestion's <label> so a vote never
 * toggles the apply-edit checkbox; stopPropagation guards the row hover/click.
 */
export default function ProofreadSuggestionFeedback({
  index,
  rating,
  disabled = false,
  onVote,
}: ProofreadSuggestionFeedbackProps) {
  const thumbStyle = (isActive: boolean) => ({
    color: isActive ? 'var(--accent-bright)' : 'var(--text-muted)',
    backgroundColor: isActive ? 'var(--accent-20)' : 'transparent',
    boxShadow: isActive ? 'var(--shadow-glow-sm)' : 'none',
  });

  const hoverMotion = disabled
    ? undefined
    : { scale: 1.12, backgroundColor: 'var(--accent-10)' };
  const tapMotion = disabled ? undefined : { scale: 0.95 };

  const handleVote = (e: React.MouseEvent<HTMLButtonElement>, next: SuggestionRating) => {
    e.preventDefault();
    e.stopPropagation();
    if (disabled) return;
    onVote(index, next);
  };

  return (
    <div
      className="flex items-center gap-1 shrink-0 mt-0.5"
      role="group"
      aria-label={`Rate suggestion ${index + 1}`}
      onClick={(e) => e.stopPropagation()}
    >
      <motion.button
        type="button"
        onClick={(e) => handleVote(e, 'up')}
        disabled={disabled}
        title="Good suggestion"
        aria-label={`Good suggestion ${index + 1}`}
        aria-pressed={rating === 'up'}
        whileHover={hoverMotion}
        whileTap={tapMotion}
        className="flex items-center justify-center h-7 w-7 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        style={thumbStyle(rating === 'up')}
      >
        <ThumbsUp size={16} fill={rating === 'up' ? 'currentColor' : 'none'} />
      </motion.button>

      <motion.button
        type="button"
        onClick={(e) => handleVote(e, 'down')}
        disabled={disabled}
        title="Bad suggestion"
        aria-label={`Bad suggestion ${index + 1}`}
        aria-pressed={rating === 'down'}
        whileHover={hoverMotion}
        whileTap={tapMotion}
        className="flex items-center justify-center h-7 w-7 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        style={thumbStyle(rating === 'down')}
      >
        <ThumbsDown size={16} fill={rating === 'down' ? 'currentColor' : 'none'} />
      </motion.button>
    </div>
  );
}

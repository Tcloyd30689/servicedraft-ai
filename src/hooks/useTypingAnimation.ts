'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

interface UseTypingAnimationOptions {
  speed?: number; // ms per character (default 30)
  enabled?: boolean;
}

interface UseTypingAnimationReturn {
  displayText: string;
  isAnimating: boolean;
  skip: () => void;
}

export function useTypingAnimation(
  fullText: string,
  options: UseTypingAnimationOptions = {},
): UseTypingAnimationReturn {
  const { speed = 30, enabled = true } = options;
  const [displayText, setDisplayText] = useState('');
  const [isAnimating, setIsAnimating] = useState(false);
  const indexRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setInterval>>(undefined);
  const fullTextRef = useRef(fullText);

  const skip = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = undefined;
    }
    setDisplayText(fullTextRef.current);
    setIsAnimating(false);
  }, []);

  useEffect(() => {
    fullTextRef.current = fullText;

    if (!enabled || !fullText) {
      setDisplayText(fullText);
      setIsAnimating(false);
      return;
    }

    // Reset for new text
    indexRef.current = 0;
    setDisplayText('');
    setIsAnimating(true);

    if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    timerRef.current = setInterval(() => {
      indexRef.current += 1;

      if (indexRef.current >= fullTextRef.current.length) {
        setDisplayText(fullTextRef.current);
        setIsAnimating(false);
        if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = undefined;
        }
      } else {
        setDisplayText(fullTextRef.current.slice(0, indexRef.current));
      }
    }, speed);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = undefined;
      }
    };
  }, [fullText, speed, enabled]);

  return { displayText, isAnimating, skip };
}

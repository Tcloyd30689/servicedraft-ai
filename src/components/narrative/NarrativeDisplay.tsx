'use client';

import { useTypingAnimation } from '@/hooks/useTypingAnimation';
import type { NarrativeData } from '@/stores/narrativeStore';

interface NarrativeDisplayProps {
  narrative: NarrativeData;
  displayFormat: 'block' | 'ccc';
  animate?: boolean;
}

export default function NarrativeDisplay({
  narrative,
  displayFormat,
  animate = false,
}: NarrativeDisplayProps) {
  const blockText = useTypingAnimation(narrative.block_narrative, {
    speed: 15,
    enabled: animate && displayFormat === 'block',
  });

  const concernText = useTypingAnimation(narrative.concern, {
    speed: 15,
    enabled: animate && displayFormat === 'ccc',
  });

  const causeText = useTypingAnimation(narrative.cause, {
    speed: 15,
    enabled: animate && displayFormat === 'ccc',
  });

  const correctionText = useTypingAnimation(narrative.correction, {
    speed: 15,
    enabled: animate && displayFormat === 'ccc',
  });

  if (displayFormat === 'block') {
    return (
      <div className="space-y-4">
        <h3 className="text-sm font-medium text-[#c4b5fd] uppercase tracking-wide">
          Block Narrative
        </h3>
        <div className="bg-[#0f0520] border border-[#6b21a8] rounded-lg p-4 min-h-[200px]">
          <p className="text-white leading-relaxed whitespace-pre-wrap text-sm">
            {animate ? blockText.displayText : narrative.block_narrative}
          </p>
          {blockText.isAnimating && (
            <span className="inline-block w-0.5 h-4 bg-[#a855f7] animate-pulse ml-0.5 align-middle" />
          )}
        </div>
        {blockText.isAnimating && (
          <button
            onClick={blockText.skip}
            className="text-xs text-[#9ca3af] hover:text-white transition-colors cursor-pointer"
          >
            Skip animation
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Concern */}
      <div>
        <h3 className="text-sm font-medium text-[#a855f7] uppercase tracking-wide mb-2">
          Concern
        </h3>
        <div className="bg-[#0f0520] border border-[#6b21a8] rounded-lg p-4">
          <p className="text-white leading-relaxed whitespace-pre-wrap text-sm">
            {animate ? concernText.displayText : narrative.concern}
          </p>
          {concernText.isAnimating && (
            <span className="inline-block w-0.5 h-4 bg-[#a855f7] animate-pulse ml-0.5 align-middle" />
          )}
        </div>
      </div>

      {/* Cause */}
      <div>
        <h3 className="text-sm font-medium text-[#a855f7] uppercase tracking-wide mb-2">
          Cause
        </h3>
        <div className="bg-[#0f0520] border border-[#6b21a8] rounded-lg p-4">
          <p className="text-white leading-relaxed whitespace-pre-wrap text-sm">
            {animate ? causeText.displayText : narrative.cause}
          </p>
          {causeText.isAnimating && (
            <span className="inline-block w-0.5 h-4 bg-[#a855f7] animate-pulse ml-0.5 align-middle" />
          )}
        </div>
      </div>

      {/* Correction */}
      <div>
        <h3 className="text-sm font-medium text-[#a855f7] uppercase tracking-wide mb-2">
          Correction
        </h3>
        <div className="bg-[#0f0520] border border-[#6b21a8] rounded-lg p-4">
          <p className="text-white leading-relaxed whitespace-pre-wrap text-sm">
            {animate ? correctionText.displayText : narrative.correction}
          </p>
          {correctionText.isAnimating && (
            <span className="inline-block w-0.5 h-4 bg-[#a855f7] animate-pulse ml-0.5 align-middle" />
          )}
        </div>
      </div>

      {(concernText.isAnimating || causeText.isAnimating || correctionText.isAnimating) && (
        <button
          onClick={() => {
            concernText.skip();
            causeText.skip();
            correctionText.skip();
          }}
          className="text-xs text-[#9ca3af] hover:text-white transition-colors cursor-pointer"
        >
          Skip animation
        </button>
      )}
    </div>
  );
}

'use client';

interface LoadingSpinnerProps {
  message?: string;
  size?: 'small' | 'medium' | 'large';
}

const sizeMap = {
  small: 'w-6 h-6',
  medium: 'w-10 h-10',
  large: 'w-16 h-16',
};

export default function LoadingSpinner({
  message,
  size = 'medium',
}: LoadingSpinnerProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-4">
      <div className="relative">
        <div
          className={`${sizeMap[size]} rounded-full border-2 border-[var(--accent-border)] border-t-[var(--accent-hover)] animate-spin`}
        />
        <div
          className={`absolute inset-0 ${sizeMap[size]} rounded-full shadow-[var(--shadow-glow-accent)] animate-[glow-pulse_2s_ease-in-out_infinite]`}
        />
      </div>
      {message && (
        <p className="text-[var(--text-secondary)] text-sm animate-pulse">{message}</p>
      )}
    </div>
  );
}

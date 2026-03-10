'use client';

interface LoadingSpinnerProps {
  message?: string;
  size?: 'small' | 'medium' | 'large' | 'xlarge';
  className?: string;
}

const sizeMap = {
  small: 'w-6 h-6',
  medium: 'w-10 h-10',
  large: 'w-16 h-16',
  xlarge: 'w-32 h-32',
};

const textSizeMap = {
  small: 'text-xs',
  medium: 'text-sm',
  large: 'text-sm',
  xlarge: 'text-2xl',
};

export default function LoadingSpinner({
  message,
  size = 'medium',
  className,
}: LoadingSpinnerProps) {
  const borderWidth = size === 'xlarge' ? 'border-4' : 'border-2';

  return (
    <div className={`flex flex-col items-center justify-center gap-4 ${className || ''}`}>
      <div className="relative">
        <div
          className={`${sizeMap[size]} rounded-full ${borderWidth} border-[var(--accent-border)] border-t-[var(--accent-hover)] animate-spin`}
        />
        <div
          className={`absolute inset-0 ${sizeMap[size]} rounded-full shadow-[var(--shadow-glow-accent)] animate-[glow-pulse_2s_ease-in-out_infinite]`}
        />
      </div>
      {message && (
        <p className={`text-[var(--text-secondary)] ${textSizeMap[size]} animate-pulse`}>{message}</p>
      )}
    </div>
  );
}

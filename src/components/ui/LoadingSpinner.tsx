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
          className={`${sizeMap[size]} rounded-full border-2 border-[#6b21a8] border-t-[#a855f7] animate-spin`}
        />
        <div
          className={`absolute inset-0 ${sizeMap[size]} rounded-full shadow-[0_0_20px_rgba(168,85,247,0.4)] animate-[glow-pulse_2s_ease-in-out_infinite]`}
        />
      </div>
      {message && (
        <p className="text-[#c4b5fd] text-sm animate-pulse">{message}</p>
      )}
    </div>
  );
}

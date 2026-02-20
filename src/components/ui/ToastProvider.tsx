'use client';

import { Toaster } from 'react-hot-toast';

export default function ToastProvider() {
  return (
    <Toaster
      position="top-center"
      toastOptions={{
        duration: 3000,
        style: {
          background: 'var(--bg-card)',
          color: 'var(--text-primary)',
          border: '1px solid var(--accent-30)',
          backdropFilter: 'blur(8px)',
          borderRadius: '12px',
          fontSize: '14px',
          zIndex: 50,
        },
        success: {
          style: {
            border: '1px solid var(--accent-50)',
            boxShadow: 'var(--shadow-glow-sm)',
          },
          iconTheme: {
            primary: 'var(--accent-hover)',
            secondary: '#ffffff',
          },
        },
        error: {
          style: {
            border: '1px solid rgba(239, 68, 68, 0.5)',
            boxShadow: '0 0 20px rgba(239, 68, 68, 0.2)',
          },
        },
      }}
    />
  );
}

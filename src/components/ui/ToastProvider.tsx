'use client';

import { Toaster } from 'react-hot-toast';

export default function ToastProvider() {
  return (
    <Toaster
      position="top-center"
      toastOptions={{
        duration: 3000,
        style: {
          background: 'rgba(197, 173, 229, 0.05)',
          color: '#ffffff',
          border: '1px solid rgba(168, 85, 247, 0.3)',
          backdropFilter: 'blur(8px)',
          borderRadius: '12px',
          fontSize: '14px',
          zIndex: 50,
        },
        success: {
          style: {
            border: '1px solid rgba(168, 85, 247, 0.5)',
            boxShadow: '0 0 20px rgba(73, 18, 155, 0.3)',
          },
          iconTheme: {
            primary: '#a855f7',
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

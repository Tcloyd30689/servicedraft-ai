'use client';

import { Moon, Sun, Sparkles } from 'lucide-react';
import { useTheme } from '@/components/ThemeProvider';
import Modal from '@/components/ui/Modal';
import AccentColorPicker from '@/components/ui/AccentColorPicker';

interface AppearanceModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AppearanceModal({ isOpen, onClose }: AppearanceModalProps) {
  const { colorMode, toggleColorMode, accent, backgroundAnimation, setBackgroundAnimation } = useTheme();

  const effectiveMode = accent.isLightMode ? 'light' : accent.isDarkMode ? 'dark' : colorMode;
  const modeLocked = accent.isLightMode || accent.isDarkMode;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="App Appearance" width="max-w-[520px]">
      <div className="space-y-6">
        {/* Accent Color Section */}
        <div>
          <h3
            className="text-sm font-semibold mb-3"
            style={{ color: 'var(--text-secondary)' }}
          >
            Accent Color
          </h3>
          <AccentColorPicker />
        </div>

        {/* Theme Section */}
        <div>
          <h3
            className="text-sm font-semibold mb-3"
            style={{ color: 'var(--text-secondary)' }}
          >
            Theme
          </h3>
          <div className="flex gap-3">
            <button
              onClick={() => {
                if (!modeLocked && effectiveMode !== 'dark') toggleColorMode();
              }}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-medium transition-all"
              style={{
                border: effectiveMode === 'dark'
                  ? '2px solid var(--accent-primary)'
                  : '2px solid var(--border-default, var(--accent-20))',
                backgroundColor: effectiveMode === 'dark'
                  ? 'var(--accent-8)'
                  : 'var(--bg-input)',
                color: 'var(--text-primary)',
                opacity: accent.isLightMode ? 0.5 : 1,
                cursor: accent.isLightMode ? 'not-allowed' : 'pointer',
              }}
              disabled={accent.isLightMode}
            >
              <Moon size={18} />
              Dark
            </button>
            <button
              onClick={() => {
                if (!modeLocked && effectiveMode !== 'light') toggleColorMode();
              }}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-medium transition-all"
              style={{
                border: effectiveMode === 'light'
                  ? '2px solid var(--accent-primary)'
                  : '2px solid var(--border-default, var(--accent-20))',
                backgroundColor: effectiveMode === 'light'
                  ? 'var(--accent-8)'
                  : 'var(--bg-input)',
                color: 'var(--text-primary)',
                opacity: accent.isDarkMode ? 0.5 : 1,
                cursor: accent.isDarkMode ? 'not-allowed' : 'pointer',
              }}
              disabled={accent.isDarkMode}
            >
              <Sun size={18} />
              Light
            </button>
          </div>
        </div>

        {/* Background Animation Section */}
        <div>
          <h3
            className="text-sm font-semibold mb-3"
            style={{ color: 'var(--text-secondary)' }}
          >
            Background Animation
          </h3>
          <button
            onClick={() => setBackgroundAnimation(!backgroundAnimation)}
            className="w-full flex items-center justify-between py-3 px-4 rounded-lg transition-colors"
            style={{
              backgroundColor: 'var(--bg-input)',
              border: '1px solid var(--accent-20)',
            }}
          >
            <div className="flex items-center gap-3">
              <Sparkles size={18} style={{ color: 'var(--accent-text-emphasis)' }} />
              <span
                className="text-sm font-medium"
                style={{ color: 'var(--text-primary)' }}
              >
                Particle Network
              </span>
            </div>
            {/* Toggle switch */}
            <div
              className="relative flex-shrink-0 transition-colors duration-200"
              style={{
                width: 48,
                height: 24,
                borderRadius: 12,
                backgroundColor: backgroundAnimation
                  ? 'var(--accent-primary)'
                  : 'var(--bg-elevated)',
              }}
            >
              <div
                className="absolute top-1 transition-all duration-200"
                style={{
                  width: 16,
                  height: 16,
                  borderRadius: '50%',
                  backgroundColor: '#ffffff',
                  left: backgroundAnimation ? 28 : 4,
                  boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
                }}
              />
            </div>
          </button>
        </div>

        {/* Hint */}
        <p
          className="italic text-center"
          style={{ color: 'var(--text-muted)', fontSize: 12 }}
        >
          Changes apply instantly — look at the background, buttons, and logo.
        </p>
      </div>
    </Modal>
  );
}

'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Settings, X, Palette, FileText, Moon, Sun, Sparkles } from 'lucide-react';
import { useTheme } from '@/components/ThemeProvider';
import AccentColorPicker from '@/components/ui/AccentColorPicker';

interface PreferencesPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

type Tab = 'appearance' | 'templates';

export default function PreferencesPanel({ isOpen, onClose }: PreferencesPanelProps) {
  const [activeTab, setActiveTab] = useState<Tab>('appearance');
  const { colorMode, toggleColorMode, accent, backgroundAnimation, setBackgroundAnimation } = useTheme();

  const effectiveMode = accent.isLightMode ? 'light' : accent.isDarkMode ? 'dark' : colorMode;
  const modeLocked = accent.isLightMode || accent.isDarkMode;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            style={{
              position: 'fixed',
              inset: 0,
              backgroundColor: 'rgba(0,0,0,0.6)',
              backdropFilter: 'blur(4px)',
              zIndex: 200,
            }}
          />

          {/* Panel */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            style={{
              position: 'fixed',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              zIndex: 201,
              width: '100%',
              maxWidth: 520,
              maxHeight: '80vh',
              overflowY: 'auto',
              background: 'var(--bg-elevated)',
              borderRadius: 'var(--radius-2xl)',
              boxShadow: 'var(--shadow-glow-md)',
              border: '1px solid var(--accent-border)',
            }}
          >
            {/* Header */}
            <div
              className="flex items-center justify-between px-6 pt-5 pb-4"
              style={{ borderBottom: '1px solid var(--accent-10)' }}
            >
              <div className="flex items-center gap-3">
                <Settings size={22} style={{ color: 'var(--accent-text-emphasis)' }} />
                <h2
                  className="text-lg font-bold"
                  style={{ color: 'var(--text-primary)' }}
                >
                  Preferences
                </h2>
              </div>
              <button
                onClick={onClose}
                className="p-1 rounded-lg transition-colors"
                style={{ color: 'var(--text-muted)' }}
                aria-label="Close preferences"
              >
                <X size={20} />
              </button>
            </div>

            {/* Tab Switcher */}
            <div className="flex mx-6 mt-4 rounded-lg overflow-hidden" style={{ border: '1px solid var(--accent-20)' }}>
              <button
                onClick={() => setActiveTab('appearance')}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium transition-colors"
                style={{
                  backgroundColor: activeTab === 'appearance' ? 'var(--accent-primary)' : 'transparent',
                  color: activeTab === 'appearance' ? 'var(--btn-text-on-accent)' : 'var(--text-secondary)',
                }}
              >
                <Palette size={16} />
                Appearance
              </button>
              <button
                onClick={() => setActiveTab('templates')}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium transition-colors"
                style={{
                  backgroundColor: activeTab === 'templates' ? 'var(--accent-primary)' : 'transparent',
                  color: activeTab === 'templates' ? 'var(--btn-text-on-accent)' : 'var(--text-secondary)',
                }}
              >
                <FileText size={16} />
                Templates
              </button>
            </div>

            {/* Tab Content */}
            <div className="px-6 py-5">
              {activeTab === 'appearance' ? (
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

                  {/* Display Mode Section */}
                  <div>
                    <h3
                      className="text-sm font-semibold mb-3"
                      style={{ color: 'var(--text-secondary)' }}
                    >
                      Display Mode
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
              ) : (
                /* Templates Tab — Placeholder */
                <div className="flex flex-col items-center justify-center py-10">
                  <FileText size={40} style={{ color: 'var(--text-muted)', opacity: 0.3 }} />
                  <h3
                    className="text-base font-semibold mt-4"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    Template Preferences
                  </h3>
                  <p
                    className="text-center mt-2 max-w-xs"
                    style={{ color: 'var(--text-muted)', fontSize: 13 }}
                  >
                    Default output format, customization presets, and saved repair templates coming soon.
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

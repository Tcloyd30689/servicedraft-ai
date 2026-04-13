'use client';

import { motion } from 'framer-motion';
import { useTheme } from '@/components/ThemeProvider';

export default function AccentColorPicker() {
  const { accent, setAccentColor, accentColors } = useTheme();

  // Swatch display color: Noir/White accents use hex values opposite to their name
  // (Noir's accent hex is light, White's accent hex is dark), so override the
  // picker circle color so it visually matches the display name.
  const swatchColor = (c: typeof accentColors[number]) =>
    c.key === 'white' ? '#1a1a2e' : c.key === 'black' ? '#f0f0f5' : c.hex;

  return (
    <div>
      <div className="flex flex-wrap gap-3 justify-center">
        {accentColors.map((color) => {
          const isSelected = accent.key === color.key;
          return (
            <motion.button
              key={color.key}
              type="button"
              onClick={() => setAccentColor(color.key)}
              whileHover={{ scale: 1.15 }}
              whileTap={{ scale: 0.95 }}
              transition={{ type: 'spring', stiffness: 400, damping: 25 }}
              style={{
                width: 36,
                height: 36,
                borderRadius: '50%',
                backgroundColor: swatchColor(color),
                border: isSelected
                  ? '3px solid var(--text-primary)'
                  : '2px solid transparent',
                boxShadow: isSelected
                  ? `0 0 12px ${color.hex}`
                  : 'none',
                cursor: 'pointer',
                outline: 'none',
              }}
              aria-label={`Select ${color.name} accent color`}
            />
          );
        })}
      </div>
      <p
        className="text-center mt-3 text-sm font-medium"
        style={{ color: 'var(--text-secondary)' }}
      >
        {accent.name}
        {accent.isLightMode && (
          <span
            className="block text-xs mt-1 italic"
            style={{ color: 'var(--text-muted)' }}
          >
            Auto-activates light mode
          </span>
        )}
        {accent.isDarkMode && (
          <span
            className="block text-xs mt-1 italic"
            style={{ color: 'var(--text-muted)' }}
          >
            Auto-activates dark mode
          </span>
        )}
      </p>
    </div>
  );
}

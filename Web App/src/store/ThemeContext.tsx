// ============================================================================
// THEME CONTEXT - MycoLab Theming System
// Implements 4 thematic variants from the design brief
// ============================================================================

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

// ============================================================================
// TYPES
// ============================================================================

export type ThemeVariant = 'mycelium' | 'fruiting' | 'spore' | 'substrate';

export interface ThemeColors {
  // Background colors
  bgPrimary: string;
  bgSecondary: string;
  bgTertiary: string;
  bgCard: string;
  bgCardHover: string;

  // Border colors
  borderPrimary: string;
  borderSecondary: string;
  borderAccent: string;

  // Text colors
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  textAccent: string;

  // Accent colors
  accent: string;
  accentHover: string;
  accentMuted: string;
  accentGlow: string;

  // Secondary accent
  secondary: string;
  secondaryHover: string;

  // Status colors
  success: string;
  successMuted: string;
  warning: string;
  warningMuted: string;
  danger: string;
  dangerMuted: string;
  info: string;
  infoMuted: string;

  // Cultivation phase colors
  phaseInoculation: string;
  phaseColonization: string;
  phaseFruiting: string;
  phaseHarvest: string;
  phaseStorage: string;
}

export interface ThemeConfig {
  id: ThemeVariant;
  name: string;
  description: string;
  icon: string;
  colors: ThemeColors;
}

// ============================================================================
// THEME DEFINITIONS
// ============================================================================

export const themes: Record<ThemeVariant, ThemeConfig> = {
  mycelium: {
    id: 'mycelium',
    name: 'Mycelium',
    description: 'Technical, research-focused with bioluminescent accents',
    icon: '🔬',
    colors: {
      // Dark, sophisticated foundation
      bgPrimary: '#000000',
      bgSecondary: '#0A1628',
      bgTertiary: '#0F1D32',
      bgCard: 'rgba(15, 29, 50, 0.5)',
      bgCardHover: 'rgba(15, 29, 50, 0.7)',

      borderPrimary: '#1E3A5F',
      borderSecondary: '#0F1D32',
      borderAccent: 'rgba(0, 217, 255, 0.3)',

      textPrimary: '#FFFFFF',
      textSecondary: '#94A3B8',
      textMuted: '#64748B',
      textAccent: '#00D9FF',

      // Electric teal accent
      accent: '#00D9FF',
      accentHover: '#33E1FF',
      accentMuted: 'rgba(0, 217, 255, 0.1)',
      accentGlow: '0 0 20px rgba(0, 217, 255, 0.3)',

      // Vibrant purple secondary
      secondary: '#7C3AED',
      secondaryHover: '#8B5CF6',

      // Status
      success: '#06D6A0',
      successMuted: 'rgba(6, 214, 160, 0.1)',
      warning: '#F59E0B',
      warningMuted: 'rgba(245, 158, 11, 0.1)',
      danger: '#EF4444',
      dangerMuted: 'rgba(239, 68, 68, 0.1)',
      info: '#06B6D4',
      infoMuted: 'rgba(6, 182, 212, 0.1)',

      // Cultivation phases
      phaseInoculation: '#7C3AED',
      phaseColonization: '#00D9FF',
      phaseFruiting: '#A855F7',
      phaseHarvest: '#06D6A0',
      phaseStorage: '#3B82F6',
    },
  },

  fruiting: {
    id: 'fruiting',
    name: 'Fruiting',
    description: 'Vibrant, celebratory for active cultivators',
    icon: '🍄',
    colors: {
      // Warm, earthy foundation
      bgPrimary: '#0C1A0F',
      bgSecondary: '#1B4332',
      bgTertiary: '#2D5A45',
      bgCard: 'rgba(27, 67, 50, 0.5)',
      bgCardHover: 'rgba(27, 67, 50, 0.7)',

      borderPrimary: '#2D5A45',
      borderSecondary: '#1B4332',
      borderAccent: 'rgba(6, 214, 160, 0.3)',

      textPrimary: '#FFFFFF',
      textSecondary: '#A7C4BC',
      textMuted: '#6B8F82',
      textAccent: '#06D6A0',

      // Bright green accent
      accent: '#06D6A0',
      accentHover: '#34E0B5',
      accentMuted: 'rgba(6, 214, 160, 0.1)',
      accentGlow: '0 0 20px rgba(6, 214, 160, 0.3)',

      // Warm orange secondary
      secondary: '#F77F00',
      secondaryHover: '#FF9A33',

      // Status
      success: '#06D6A0',
      successMuted: 'rgba(6, 214, 160, 0.1)',
      warning: '#F77F00',
      warningMuted: 'rgba(247, 127, 0, 0.1)',
      danger: '#D62828',
      dangerMuted: 'rgba(214, 40, 40, 0.1)',
      info: '#3B82F6',
      infoMuted: 'rgba(59, 130, 246, 0.1)',

      // Cultivation phases
      phaseInoculation: '#F77F00',
      phaseColonization: '#FBBF24',
      phaseFruiting: '#D62828',
      phaseHarvest: '#06D6A0',
      phaseStorage: '#6B8F82',
    },
  },

  spore: {
    id: 'spore',
    name: 'Spore',
    description: 'Clean, minimal for quick functional tracking',
    icon: '✨',
    colors: {
      // Light, airy foundation
      bgPrimary: '#FAFAF9',
      bgSecondary: '#F5F5F0',
      bgTertiary: '#ECECE5',
      bgCard: 'rgba(255, 255, 255, 0.8)',
      bgCardHover: 'rgba(255, 255, 255, 0.95)',

      borderPrimary: '#D4D4C8',
      borderSecondary: '#E5E5DC',
      borderAccent: 'rgba(123, 165, 136, 0.5)',

      textPrimary: '#1C1917',
      textSecondary: '#57534E',
      textMuted: '#A8A29E',
      textAccent: '#4A7C59',

      // Soft sage accent
      accent: '#7BA588',
      accentHover: '#6B9578',
      accentMuted: 'rgba(123, 165, 136, 0.1)',
      accentGlow: '0 0 20px rgba(123, 165, 136, 0.2)',

      // Muted blue secondary
      secondary: '#4A90A4',
      secondaryHover: '#5BA0B4',

      // Status
      success: '#4A7C59',
      successMuted: 'rgba(74, 124, 89, 0.1)',
      warning: '#B45309',
      warningMuted: 'rgba(180, 83, 9, 0.1)',
      danger: '#B91C1C',
      dangerMuted: 'rgba(185, 28, 28, 0.1)',
      info: '#4A90A4',
      infoMuted: 'rgba(74, 144, 164, 0.1)',

      // Cultivation phases
      phaseInoculation: '#4A90A4',
      phaseColonization: '#7BA588',
      phaseFruiting: '#B45309',
      phaseHarvest: '#4A7C59',
      phaseStorage: '#A8A29E',
    },
  },

  substrate: {
    id: 'substrate',
    name: 'Substrate',
    description: 'Organic, botanical with hand-drawn aesthetics',
    icon: '🌿',
    colors: {
      // Warm, natural earth tones
      bgPrimary: '#1A1410',
      bgSecondary: '#3E2723',
      bgTertiary: '#4E342E',
      bgCard: 'rgba(62, 39, 35, 0.5)',
      bgCardHover: 'rgba(62, 39, 35, 0.7)',

      borderPrimary: '#5D4037',
      borderSecondary: '#4E342E',
      borderAccent: 'rgba(193, 154, 107, 0.3)',

      textPrimary: '#FFF8E1',
      textSecondary: '#D7CCC8',
      textMuted: '#A1887F',
      textAccent: '#C19A6B',

      // Warm tan accent
      accent: '#C19A6B',
      accentHover: '#D4AD7E',
      accentMuted: 'rgba(193, 154, 107, 0.1)',
      accentGlow: '0 0 20px rgba(193, 154, 107, 0.3)',

      // Forest green secondary
      secondary: '#2D5016',
      secondaryHover: '#3D6020',

      // Status
      success: '#558B2F',
      successMuted: 'rgba(85, 139, 47, 0.1)',
      warning: '#E65100',
      warningMuted: 'rgba(230, 81, 0, 0.1)',
      danger: '#C62828',
      dangerMuted: 'rgba(198, 40, 40, 0.1)',
      info: '#0277BD',
      infoMuted: 'rgba(2, 119, 189, 0.1)',

      // Cultivation phases
      phaseInoculation: '#E65100',
      phaseColonization: '#C19A6B',
      phaseFruiting: '#C62828',
      phaseHarvest: '#558B2F',
      phaseStorage: '#5D4037',
    },
  },
};

// ============================================================================
// CONTEXT
// ============================================================================

interface ThemeContextType {
  theme: ThemeVariant;
  themeConfig: ThemeConfig;
  setTheme: (theme: ThemeVariant) => void;
  isDark: boolean;
}

const ThemeContext = createContext<ThemeContextType | null>(null);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
};

// ============================================================================
// CSS VARIABLE INJECTION
// ============================================================================

const applyThemeToDOM = (themeConfig: ThemeConfig) => {
  const root = document.documentElement;
  const { colors } = themeConfig;

  // Apply all color variables
  Object.entries(colors).forEach(([key, value]) => {
    // Convert camelCase to kebab-case
    const cssVar = `--${key.replace(/([A-Z])/g, '-$1').toLowerCase()}`;
    root.style.setProperty(cssVar, value);
  });

  // Set theme attribute for conditional styling
  root.setAttribute('data-theme', themeConfig.id);

  // Set color scheme for browser UI
  const isDark = themeConfig.id !== 'spore';
  root.style.colorScheme = isDark ? 'dark' : 'light';
};

// ============================================================================
// PROVIDER COMPONENT
// ============================================================================

interface ThemeProviderProps {
  children: React.ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const [theme, setThemeState] = useState<ThemeVariant>(() => {
    // Load from localStorage or default to mycelium
    const saved = localStorage.getItem('mycolab-theme');
    if (saved && (saved === 'mycelium' || saved === 'fruiting' || saved === 'spore' || saved === 'substrate')) {
      return saved;
    }
    return 'mycelium';
  });

  const themeConfig = themes[theme];
  const isDark = theme !== 'spore';

  // Apply theme to DOM when it changes
  useEffect(() => {
    applyThemeToDOM(themeConfig);
  }, [themeConfig]);

  const setTheme = useCallback((newTheme: ThemeVariant) => {
    setThemeState(newTheme);
    localStorage.setItem('mycolab-theme', newTheme);
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, themeConfig, setTheme, isDark }}>
      {children}
    </ThemeContext.Provider>
  );
};

// ============================================================================
// THEME SELECTOR COMPONENT
// ============================================================================

interface ThemeSelectorProps {
  compact?: boolean;
}

export const ThemeSelector: React.FC<ThemeSelectorProps> = ({ compact = false }) => {
  const { theme, setTheme } = useTheme();

  if (compact) {
    return (
      <div className="flex gap-2">
        {Object.values(themes).map((t) => (
          <button
            key={t.id}
            onClick={() => setTheme(t.id)}
            className={`
              w-10 h-10 rounded-lg flex items-center justify-center text-lg
              transition-all duration-200 border-2
              ${theme === t.id
                ? 'border-[var(--accent)] bg-[var(--accent-muted)] scale-110'
                : 'border-[var(--border-primary)] hover:border-[var(--border-accent)] hover:scale-105'
              }
            `}
            title={t.name}
          >
            {t.icon}
          </button>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3">
      {Object.values(themes).map((t) => (
        <button
          key={t.id}
          onClick={() => setTheme(t.id)}
          className={`
            p-4 rounded-xl border-2 text-left transition-all duration-200
            ${theme === t.id
              ? 'border-[var(--accent)] bg-[var(--accent-muted)]'
              : 'border-[var(--border-primary)] hover:border-[var(--border-accent)]'
            }
          `}
        >
          <div className="flex items-center gap-3 mb-2">
            <span className="text-2xl">{t.icon}</span>
            <span className="font-medium text-[var(--text-primary)]">{t.name}</span>
            {theme === t.id && (
              <span className="ml-auto text-[var(--accent)]">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
              </span>
            )}
          </div>
          <p className="text-sm text-[var(--text-muted)]">{t.description}</p>
        </button>
      ))}
    </div>
  );
};

export default ThemeProvider;

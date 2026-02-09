import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { Loader2 } from 'lucide-react';

export type AppTheme = 'light' | 'dark';

interface ThemeContextValue {
  theme: AppTheme;
  setTheme: (t: AppTheme) => void;
  toggle: () => void;
  isThemeSwitching: boolean;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

const THEME_STORAGE_KEY = 'ayphen-theme';

export default function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<AppTheme>(() => {
    // Initialize from localStorage or default to light
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    return (stored as AppTheme) || 'light';
  });
  const [isThemeSwitching, setIsThemeSwitching] = useState(false);

  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute('data-theme', theme);

    // Apply dark class for Tailwind dark mode
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }

    // Save to localStorage
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  }, [theme]);

  const setTheme = (newTheme: AppTheme) => {
    if (newTheme === theme) return;

    // Show loader during theme transition
    setIsThemeSwitching(true);

    // Use requestAnimationFrame for smooth transition
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setThemeState(newTheme);
        // Keep loader visible during transition
        setTimeout(() => {
          setIsThemeSwitching(false);
        }, 300);
      });
    });
  };

  const toggle = () => setTheme(theme === 'light' ? 'dark' : 'light');

  const ctx: ThemeContextValue = useMemo(
    () => ({ theme, setTheme, toggle, isThemeSwitching }),
    [theme, isThemeSwitching]
  );

  return (
    <ThemeContext.Provider value={ctx}>
      {children}
      {/* Theme switching overlay with blur effect */}
      {isThemeSwitching && (
        <div className='fixed inset-0 z-[9999] flex items-center justify-center bg-background/80 backdrop-blur-sm'>
          <Loader2 className='h-12 w-12 animate-spin text-primary' />
        </div>
      )}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}

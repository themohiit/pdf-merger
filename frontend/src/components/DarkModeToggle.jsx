import { useState, useEffect } from 'react';
import { Sun, Moon } from 'lucide-react';

/**
 * DarkModeToggle — toggles between light and dark mode.
 * Persists preference in localStorage and defaults to dark.
 */
export default function DarkModeToggle() {
  const [isDark, setIsDark] = useState(() => {
    // Check localStorage first, then system preference, default to dark
    const stored = localStorage.getItem('theme');
    if (stored) return stored === 'dark';
    if (typeof window !== 'undefined' && window.matchMedia) {
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return true;
  });

  useEffect(() => {
    const root = document.documentElement;
    if (isDark) {
      root.classList.add('dark');
      document.body.classList.add('bg-surface-950', 'text-white');
      document.body.classList.remove('bg-surface-50', 'text-surface-900');
    } else {
      root.classList.remove('dark');
      document.body.classList.remove('bg-surface-950', 'text-white');
      document.body.classList.add('bg-surface-50', 'text-surface-900');
    }
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
  }, [isDark]);

  return (
    <button
      onClick={() => setIsDark((prev) => !prev)}
      className="relative p-2.5 rounded-xl bg-white/5 border border-white/10 
                 hover:bg-white/10 hover:border-white/20 
                 dark:bg-white/5 dark:border-white/10 dark:hover:bg-white/10
                 transition-all duration-300 ease-out
                 focus:outline-none focus:ring-2 focus:ring-primary-500/50"
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      <div className="relative w-5 h-5">
        {/* Sun icon — shown in dark mode (click to go light) */}
        <Sun
          className={`absolute inset-0 w-5 h-5 text-amber-400 transition-all duration-300
                      ${isDark ? 'opacity-100 rotate-0 scale-100' : 'opacity-0 rotate-90 scale-50'}`}
        />
        {/* Moon icon — shown in light mode (click to go dark) */}
        <Moon
          className={`absolute inset-0 w-5 h-5 text-primary-400 transition-all duration-300
                      ${isDark ? 'opacity-0 -rotate-90 scale-50' : 'opacity-100 rotate-0 scale-100'}`}
        />
      </div>
    </button>
  );
}

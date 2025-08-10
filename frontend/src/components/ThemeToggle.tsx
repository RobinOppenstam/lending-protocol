// src/components/ThemeToggle.tsx
'use client';

import { useTheme } from '@/contexts/ThemeContext';
import { Sun, Moon } from 'lucide-react';
import { useState, useEffect } from 'react';

export function ThemeToggle() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <button
        className="relative p-2 rounded-lg bg-secondary hover:bg-accent transition-colors"
        aria-label="Toggle theme"
      >
        <div className="relative w-5 h-5">
          <Sun className="w-5 h-5 text-yellow-500" />
        </div>
      </button>
    );
  }

  return <ThemeToggleClient />;
}

function ThemeToggleClient() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="relative p-2 rounded-lg bg-secondary hover:bg-accent transition-colors"
      aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
    >
      <div className="relative w-5 h-5">
        {/* Sun Icon */}
        <Sun 
          className={`absolute inset-0 w-5 h-5 text-yellow-500 transition-all duration-300 ${
            theme === 'light' 
              ? 'opacity-100 rotate-0 scale-100' 
              : 'opacity-0 rotate-90 scale-75'
          }`}
        />
        
        {/* Moon Icon */}
        <Moon 
          className={`absolute inset-0 w-5 h-5 text-secondary-foreground transition-all duration-300 ${
            theme === 'dark' 
              ? 'opacity-100 rotate-0 scale-100' 
              : 'opacity-0 -rotate-90 scale-75'
          }`}
        />
      </div>
    </button>
  );
}

// Alternative toggle switch style
export function ThemeToggleSwitch() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <button
        className="relative inline-flex h-6 w-11 items-center rounded-full bg-secondary transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        aria-label="Toggle theme"
      >
        <span className="inline-block h-4 w-4 transform rounded-full bg-white translate-x-1">
          <span className="flex h-full w-full items-center justify-center">
            <Sun className="h-2.5 w-2.5 text-yellow-500" />
          </span>
        </span>
      </button>
    );
  }

  return <ThemeToggleSwitchClient />;
}

function ThemeToggleSwitchClient() {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <button
      onClick={toggleTheme}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
        isDark 
          ? 'bg-blue-600' 
          : 'bg-secondary'
      }`}
      aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
    >
      {/* Toggle Knob */}
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
          isDark ? 'translate-x-6' : 'translate-x-1'
        }`}
      >
        {/* Icon inside knob */}
        <span className="flex h-full w-full items-center justify-center">
          {isDark ? (
            <Moon className="h-2.5 w-2.5 text-blue-600" />
          ) : (
            <Sun className="h-2.5 w-2.5 text-yellow-500" />
          )}
        </span>
      </span>
    </button>
  );
}
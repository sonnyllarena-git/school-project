import { useEffect, useState } from 'react';

const KEY = 'theme'; // 'light' | 'dark'

function apply(theme) {
  document.documentElement.dataset.theme = theme;
}

export function useTheme() {
  const [theme, setThemeState] = useState(() => {
    const saved = localStorage.getItem(KEY);
    return saved || 'light';
  });

  useEffect(() => { apply(theme); }, [theme]);

  function setTheme(next) {
    localStorage.setItem(KEY, next);
    setThemeState(next);
  }

  return { theme, toggleTheme: () => setTheme(theme === 'dark' ? 'light' : 'dark'), setTheme };
}

const UI_THEME_KEY = 'uiTheme'; // 'modern' | 'win95' | 'win2000'

function applyUITheme(uiTheme) {
  if (uiTheme === 'modern') delete document.documentElement.dataset.uiTheme;
  else document.documentElement.dataset.uiTheme = uiTheme;
}

export function useUITheme() {
  const [uiTheme, setUIThemeState] = useState(() => localStorage.getItem(UI_THEME_KEY) || 'modern');

  useEffect(() => { applyUITheme(uiTheme); }, [uiTheme]);

  function setUITheme(next) {
    localStorage.setItem(UI_THEME_KEY, next);
    setUIThemeState(next);
  }

  return { uiTheme, setUITheme };
}

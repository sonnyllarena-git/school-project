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

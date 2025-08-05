import { useState, useEffect } from 'react';

export function useTheme() {
  // Initialize darkMode state from localStorage if available, otherwise default to true
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    // Check if we're on the client side
    if (typeof window !== 'undefined') {
      const savedMode = localStorage.getItem('darkMode');
      return savedMode === null ? true : savedMode !== 'false';
    }
    return true; // Default to dark mode if localStorage not available
  });

  // Apply theme class to body when darkMode changes
  useEffect(() => {
    if (darkMode) {
      document.body.classList.add('dark-theme');
      document.body.classList.remove('light-theme');
    } else {
      document.body.classList.add('light-theme');
      document.body.classList.remove('dark-theme');
    }
  }, [darkMode]);

  // Function to toggle theme - only call this when user explicitly wants to change theme
  const toggleTheme = () => {
    const newMode = !darkMode;
    setDarkMode(newMode);
    // Save to localStorage for persistence
    if (typeof window !== 'undefined') {
      localStorage.setItem('darkMode', newMode.toString());
    }
  };

  // Function to set theme explicitly (for account settings)
  const setTheme = (isDark: boolean) => {
    setDarkMode(isDark);
    if (typeof window !== 'undefined') {
      localStorage.setItem('darkMode', isDark.toString());
    }
  };

  return { darkMode, toggleTheme, setTheme };
} 
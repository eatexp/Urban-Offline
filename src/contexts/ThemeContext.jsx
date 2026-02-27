/* eslint-disable react-refresh/only-export-components -- Context + hooks coexist intentionally */
/**
 * ThemeContext - Platform-Aware Theme Provider
 * 
 * Provides theme state, platform detection, and dark mode management
 * throughout the application. Sets CSS custom properties for
 * platform-specific styling.
 * 
 * Compliance: VISION.md §4 - Premium Native Experience
 */

import React, { createContext, useContext, useEffect, useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { isIOSNative, isAndroidNative, isNativeMobile, isWeb } from '../utils/platform';
import { createLogger } from '../utils/logger';

const log = createLogger('ThemeContext');

// Theme context
const ThemeContext = createContext({
  theme: 'dark',
  platform: 'web',
  isNative: false,
  isIOS: false,
  isAndroid: false,
  animationsEnabled: true,
  reducedMotion: false,
  setTheme: () => { },
  toggleTheme: () => { },
  getCategoryColor: () => ({}),
  getPlatformClass: () => '',
  getAnimationConfig: () => ({}),
});

// Category color mapping
const CATEGORY_COLORS = {
  medical: {
    primary: 'var(--teal-500)',
    bg: 'rgba(20, 184, 166, 0.15)',
    border: 'rgba(20, 184, 166, 0.3)',
    glow: '0 0 20px rgba(20, 184, 166, 0.2)',
    gradient: 'linear-gradient(135deg, #2dd4bf 0%, #0d9488 100%)',
    icon: 'text-teal-400',
    badge: 'badge-teal',
  },
  survival: {
    primary: 'var(--olive-500)',
    bg: 'rgba(139, 150, 88, 0.15)',
    border: 'rgba(139, 150, 88, 0.3)',
    glow: '0 0 20px rgba(139, 150, 88, 0.2)',
    gradient: 'linear-gradient(135deg, #a7b17d 0%, #6e7843 100%)',
    icon: 'text-olive-400',
    badge: 'badge-olive',
  },
  legal: {
    primary: 'var(--amber-500)',
    bg: 'rgba(245, 158, 11, 0.15)',
    border: 'rgba(245, 158, 11, 0.3)',
    glow: '0 0 20px rgba(245, 158, 11, 0.2)',
    gradient: 'linear-gradient(135deg, #fbbf24 0%, #d97706 100%)',
    icon: 'text-amber-400',
    badge: 'badge-amber',
  },
  ai: {
    primary: 'var(--copper-500)',
    bg: 'rgba(201, 118, 78, 0.15)',
    border: 'rgba(201, 118, 78, 0.3)',
    glow: '0 0 20px rgba(201, 118, 78, 0.2)',
    gradient: 'linear-gradient(135deg, #db9470 0%, #b05f38 100%)',
    icon: 'text-copper-400',
    badge: 'badge-copper',
  },
  emergency: {
    primary: 'var(--danger-500)',
    bg: 'rgba(220, 38, 38, 0.15)',
    border: 'rgba(220, 38, 38, 0.3)',
    glow: '0 0 20px rgba(220, 38, 38, 0.3)',
    gradient: 'linear-gradient(135deg, #f87171 0%, #b91c1c 100%)',
    icon: 'text-red-400',
    badge: 'badge-emergency',
  },
  general: {
    primary: 'var(--accent-secondary)',
    bg: 'rgba(99, 102, 241, 0.15)',
    border: 'rgba(99, 102, 241, 0.3)',
    glow: '0 0 20px rgba(99, 102, 241, 0.2)',
    gradient: 'linear-gradient(135deg, #818cf8 0%, #6366f1 100%)',
    icon: 'text-indigo-400',
    badge: 'badge-indigo',
  },
};

// Animation configurations by platform
const ANIMATION_CONFIGS = {
  ios: {
    spring: { type: 'spring', stiffness: 300, damping: 30 },
    transition: { duration: 0.35, ease: [0.175, 0.885, 0.32, 1.275] },
    stagger: 0.03,
    scale: { hover: 1.02, tap: 0.98 },
  },
  android: {
    spring: { type: 'tween', duration: 0.25, ease: [0.4, 0, 0.2, 1] },
    transition: { duration: 0.25, ease: [0.4, 0, 0.2, 1] },
    stagger: 0.02,
    scale: { hover: 1.01, tap: 0.97 },
  },
  web: {
    spring: { type: 'spring', stiffness: 400, damping: 30 },
    transition: { duration: 0.25, ease: 'easeOut' },
    stagger: 0.02,
    scale: { hover: 1.02, tap: 0.98 },
  },
};

/**
 * Theme Provider Component
 */
export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState('dark');
  const [platform, setPlatform] = useState('web');
  const [isNative, setIsNative] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);
  const [animationsEnabled, setAnimationsEnabled] = useState(true);
  const [reducedMotion, setReducedMotion] = useState(false);

  // Initialize platform detection
  useEffect(() => {
    const detectPlatform = () => {
      const native = isNativeMobile();
      const ios = isIOSNative();
      const android = isAndroidNative();
      const web = isWeb();

      setIsNative(native);
      setIsIOS(ios);
      setIsAndroid(android);

      // Determine platform string
      let platformName = 'web';
      if (ios) platformName = 'ios';
      else if (android) platformName = 'android';
      else if (web) platformName = 'web';

      setPlatform(platformName);

      // Set data-platform attribute on html element
      document.documentElement.setAttribute('data-platform', platformName);

      log.info('Platform detected', { platform: platformName, native, ios, android });
    };

    detectPlatform();

    // Listen for platform changes (e.g., orientation, dark mode toggle)
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
      // Auto-switch theme based on system preference if user hasn't manually set
      if (!localStorage.getItem('theme')) {
        setThemeState(mediaQuery.matches ? 'dark' : 'light');
      }
    };

    // Check for reduced motion preference
    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setReducedMotion(motionQuery.matches);
    setAnimationsEnabled(!motionQuery.matches);

    const handleMotionChange = (e) => {
      setReducedMotion(e.matches);
      setAnimationsEnabled(!e.matches);
    };

    mediaQuery.addEventListener('change', handleChange);
    motionQuery.addEventListener('change', handleMotionChange);

    return () => {
      mediaQuery.removeEventListener('change', handleChange);
      motionQuery.removeEventListener('change', handleMotionChange);
    };
  }, []);

  // Load saved theme preference
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setThemeState(savedTheme);
    } else {
      // Default to dark mode (emergency app aesthetic)
      setThemeState('dark');
    }
  }, []);

  // Apply theme changes
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  // Set theme function
  const setTheme = (newTheme) => {
    setThemeState(newTheme);
  };

  // Toggle theme
  const toggleTheme = () => {
    setThemeState(prev => prev === 'dark' ? 'light' : 'dark');
  };

  // Get category colors
  const getCategoryColor = (category) => {
    return CATEGORY_COLORS[category?.toLowerCase()] || CATEGORY_COLORS.general;
  };

  // Get platform-specific CSS class
  const getPlatformClass = () => {
    return `platform-${platform}`;
  };

  // Get animation config for current platform
  const getAnimationConfig = () => {
    if (reducedMotion) {
      return {
        spring: { type: 'tween', duration: 0.01 },
        transition: { duration: 0.01 },
        stagger: 0,
        scale: { hover: 1, tap: 1 },
      };
    }
    return ANIMATION_CONFIGS[platform] || ANIMATION_CONFIGS.web;
  };

  // Context value
  const value = {
    theme,
    platform,
    isNative,
    isIOS,
    isAndroid,
    animationsEnabled,
    reducedMotion,
    setTheme,
    toggleTheme,
    getCategoryColor,
    getPlatformClass,
    getAnimationConfig,
  };

  return (
    <ThemeContext.Provider value={value}>
      <div className={`theme-wrapper ${getPlatformClass()} theme-${theme}`}>
        {children}
      </div>
    </ThemeContext.Provider>
  );
}

/**
 * Hook to use theme context
 */
export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

/**
 * Hook for category colors
 */
export function useCategoryColor(category) {
  const { getCategoryColor } = useTheme();
  return getCategoryColor(category);
}

/**
 * Hook for animation config
 */
export function useAnimationConfig() {
  const { getAnimationConfig, animationsEnabled } = useTheme();
  const config = getAnimationConfig();

  return {
    ...config,
    enabled: animationsEnabled,
    // Helper for framer-motion props
    getSpringProps: (custom = {}) => ({
      initial: animationsEnabled ? { opacity: 0, y: 20 } : false,
      animate: { opacity: 1, y: 0 },
      exit: animationsEnabled ? { opacity: 0, y: -20 } : false,
      transition: config.spring,
      ...custom,
    }),
    getTransitionProps: (custom = {}) => ({
      transition: config.transition,
      ...custom,
    }),
  };
}

export default ThemeContext;
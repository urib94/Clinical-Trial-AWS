'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';

interface AccessibilityState {
  // Theme and visual preferences
  fontSize: 'small' | 'medium' | 'large' | 'extra-large';
  highContrast: boolean;
  reducedMotion: boolean;
  colorBlindnessMode: 'none' | 'protanopia' | 'deuteranopia' | 'tritanopia';
  darkMode: boolean;
  
  // Navigation and interaction
  keyboardNavigation: boolean;
  announcements: string[];
  focusVisible: boolean;
  
  // Screen reader support
  screenReaderAnnouncements: boolean;
  
  // User preferences detection
  systemPreferences: {
    prefersReducedMotion: boolean;
    prefersHighContrast: boolean;
    prefersColorScheme: 'light' | 'dark';
  };
}

interface AccessibilityActions {
  setFontSize: (size: AccessibilityState['fontSize']) => void;
  toggleHighContrast: () => void;
  toggleReducedMotion: () => void;
  setColorBlindnessMode: (mode: AccessibilityState['colorBlindnessMode']) => void;
  toggleDarkMode: () => void;
  announce: (message: string, priority?: 'polite' | 'assertive') => void;
  clearAnnouncements: () => void;
  updateSystemPreferences: () => void;
}

interface AccessibilityContextValue extends AccessibilityState, AccessibilityActions {}

const AccessibilityContext = createContext<AccessibilityContextValue | null>(null);

export function useAccessibility() {
  const context = useContext(AccessibilityContext);
  if (!context) {
    throw new Error('useAccessibility must be used within an AccessibilityProvider');
  }
  return context;
}

interface AccessibilityProviderProps {
  children: React.ReactNode;
}

export function AccessibilityProvider({ children }: AccessibilityProviderProps) {
  const [state, setState] = useState<AccessibilityState>({
    fontSize: 'medium',
    highContrast: false,
    reducedMotion: false,
    colorBlindnessMode: 'none',
    darkMode: false,
    keyboardNavigation: false,
    announcements: [],
    focusVisible: false,
    screenReaderAnnouncements: true,
    systemPreferences: {
      prefersReducedMotion: false,
      prefersHighContrast: false,
      prefersColorScheme: 'light',
    },
  });

  // Detect system preferences
  const updateSystemPreferences = useCallback(() => {
    if (typeof window === 'undefined') return;
    
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const prefersHighContrast = window.matchMedia('(prefers-contrast: high)').matches;
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    setState(prev => ({
      ...prev,
      systemPreferences: {
        prefersReducedMotion,
        prefersHighContrast,
        prefersColorScheme: prefersDark ? 'dark' : 'light',
      },
      // Apply system preferences if not manually overridden
      reducedMotion: prefersReducedMotion,
      highContrast: prefersHighContrast,
      darkMode: prefersDark,
    }));
  }, []);

  // Set font size
  const setFontSize = useCallback((size: AccessibilityState['fontSize']) => {
    setState(prev => ({ ...prev, fontSize: size }));
    
    // Apply font size to document
    const scale = {
      small: '0.875',
      medium: '1',
      large: '1.125',
      'extra-large': '1.25',
    }[size];
    
    document.documentElement.style.setProperty('--font-scale', scale);
    
    // Save preference
    localStorage.setItem('clinical-trial-font-size', size);
  }, []);

  // Toggle high contrast
  const toggleHighContrast = useCallback(() => {
    setState(prev => {
      const newHighContrast = !prev.highContrast;
      
      // Apply high contrast class to document
      if (newHighContrast) {
        document.documentElement.classList.add('high-contrast');
      } else {
        document.documentElement.classList.remove('high-contrast');
      }
      
      // Save preference
      localStorage.setItem('clinical-trial-high-contrast', String(newHighContrast));
      
      return { ...prev, highContrast: newHighContrast };
    });
  }, []);

  // Toggle reduced motion
  const toggleReducedMotion = useCallback(() => {
    setState(prev => {
      const newReducedMotion = !prev.reducedMotion;
      
      // Apply reduced motion class to document
      if (newReducedMotion) {
        document.documentElement.classList.add('reduced-motion');
      } else {
        document.documentElement.classList.remove('reduced-motion');
      }
      
      // Save preference
      localStorage.setItem('clinical-trial-reduced-motion', String(newReducedMotion));
      
      return { ...prev, reducedMotion: newReducedMotion };
    });
  }, []);

  // Set color blindness mode
  const setColorBlindnessMode = useCallback((mode: AccessibilityState['colorBlindnessMode']) => {
    setState(prev => {
      // Remove existing color blindness classes
      document.documentElement.classList.remove(
        'protanopia', 'deuteranopia', 'tritanopia'
      );
      
      // Apply new color blindness class
      if (mode !== 'none') {
        document.documentElement.classList.add(mode);
      }
      
      // Save preference
      localStorage.setItem('clinical-trial-color-blindness', mode);
      
      return { ...prev, colorBlindnessMode: mode };
    });
  }, []);

  // Toggle dark mode
  const toggleDarkMode = useCallback(() => {
    setState(prev => {
      const newDarkMode = !prev.darkMode;
      
      // Apply dark mode class to document
      if (newDarkMode) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
      
      // Save preference
      localStorage.setItem('clinical-trial-dark-mode', String(newDarkMode));
      
      return { ...prev, darkMode: newDarkMode };
    });
  }, []);

  // Announce to screen readers
  const announce = useCallback((
    message: string, 
    priority: 'polite' | 'assertive' = 'polite'
  ) => {
    if (!state.screenReaderAnnouncements) return;
    
    setState(prev => ({
      ...prev,
      announcements: [...prev.announcements, message]
    }));
    
    // Create or update live region
    let liveRegion = document.getElementById(`live-region-${priority}`);
    if (!liveRegion) {
      liveRegion = document.createElement('div');
      liveRegion.id = `live-region-${priority}`;
      liveRegion.setAttribute('aria-live', priority);
      liveRegion.setAttribute('aria-atomic', 'true');
      liveRegion.className = 'sr-only';
      document.body.appendChild(liveRegion);
    }
    
    // Clear and set new message
    liveRegion.textContent = '';
    setTimeout(() => {
      liveRegion!.textContent = message;
    }, 100);
    
    // Clean up announcement after a delay
    setTimeout(() => {
      setState(prev => ({
        ...prev,
        announcements: prev.announcements.filter(ann => ann !== message)
      }));
    }, 5000);
  }, [state.screenReaderAnnouncements]);

  // Clear announcements
  const clearAnnouncements = useCallback(() => {
    setState(prev => ({ ...prev, announcements: [] }));
    
    // Clear live regions
    const liveRegions = document.querySelectorAll('[id^="live-region-"]');
    liveRegions.forEach(region => {
      region.textContent = '';
    });
  }, []);

  // Keyboard navigation detection
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Tab') {
        setState(prev => ({ ...prev, keyboardNavigation: true, focusVisible: true }));
      }
    };
    
    const handleMouseDown = () => {
      setState(prev => ({ ...prev, focusVisible: false }));
    };
    
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handleMouseDown);
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleMouseDown);
    };
  }, []);

  // System preference change listeners
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const highContrastQuery = window.matchMedia('(prefers-contrast: high)');
    const darkModeQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const handleReducedMotionChange = (e: MediaQueryListEvent) => {
      setState(prev => ({
        ...prev,
        systemPreferences: {
          ...prev.systemPreferences,
          prefersReducedMotion: e.matches,
        },
      }));
    };
    
    const handleHighContrastChange = (e: MediaQueryListEvent) => {
      setState(prev => ({
        ...prev,
        systemPreferences: {
          ...prev.systemPreferences,
          prefersHighContrast: e.matches,
        },
      }));
    };
    
    const handleDarkModeChange = (e: MediaQueryListEvent) => {
      setState(prev => ({
        ...prev,
        systemPreferences: {
          ...prev.systemPreferences,
          prefersColorScheme: e.matches ? 'dark' : 'light',
        },
      }));
    };
    
    reducedMotionQuery.addEventListener('change', handleReducedMotionChange);
    highContrastQuery.addEventListener('change', handleHighContrastChange);
    darkModeQuery.addEventListener('change', handleDarkModeChange);
    
    return () => {
      reducedMotionQuery.removeEventListener('change', handleReducedMotionChange);
      highContrastQuery.removeEventListener('change', handleHighContrastChange);
      darkModeQuery.removeEventListener('change', handleDarkModeChange);
    };
  }, []);

  // Load saved preferences on mount
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    // Load saved preferences
    const savedFontSize = localStorage.getItem('clinical-trial-font-size') as AccessibilityState['fontSize'];
    const savedHighContrast = localStorage.getItem('clinical-trial-high-contrast') === 'true';
    const savedReducedMotion = localStorage.getItem('clinical-trial-reduced-motion') === 'true';
    const savedColorBlindness = localStorage.getItem('clinical-trial-color-blindness') as AccessibilityState['colorBlindnessMode'];
    const savedDarkMode = localStorage.getItem('clinical-trial-dark-mode') === 'true';
    
    // Apply saved preferences
    if (savedFontSize) setFontSize(savedFontSize);
    if (savedHighContrast) toggleHighContrast();
    if (savedReducedMotion) toggleReducedMotion();
    if (savedColorBlindness) setColorBlindnessMode(savedColorBlindness);
    if (savedDarkMode) toggleDarkMode();
    
    // Update system preferences
    updateSystemPreferences();
  }, [setFontSize, toggleHighContrast, toggleReducedMotion, setColorBlindnessMode, toggleDarkMode, updateSystemPreferences]);

  // Focus visible styles
  useEffect(() => {
    if (state.focusVisible) {
      document.documentElement.classList.add('focus-visible');
    } else {
      document.documentElement.classList.remove('focus-visible');
    }
  }, [state.focusVisible]);

  const contextValue: AccessibilityContextValue = {
    ...state,
    setFontSize,
    toggleHighContrast,
    toggleReducedMotion,
    setColorBlindnessMode,
    toggleDarkMode,
    announce,
    clearAnnouncements,
    updateSystemPreferences,
  };

  return (
    <AccessibilityContext.Provider value={contextValue}>
      {children}
    </AccessibilityContext.Provider>
  );
}
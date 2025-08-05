'use client'

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react'

export type ThemeMode = 'light' | 'dark' | 'system'
export type FontSize = 'small' | 'medium' | 'large' | 'extra-large'
export type ColorBlindnessMode = 'none' | 'protanopia' | 'deuteranopia' | 'tritanopia'

export interface ThemeSettings {
  mode: ThemeMode
  fontSize: FontSize
  highContrast: boolean
  reducedMotion: boolean
  colorBlindnessMode: ColorBlindnessMode
}

interface ThemeContextType extends ThemeSettings {
  setMode: (mode: ThemeMode) => void
  setFontSize: (size: FontSize) => void
  setHighContrast: (enabled: boolean) => void
  setReducedMotion: (enabled: boolean) => void
  setColorBlindnessMode: (mode: ColorBlindnessMode) => void
  resetToDefaults: () => void
  currentTheme: 'light' | 'dark'
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

const defaultSettings: ThemeSettings = {
  mode: 'system',
  fontSize: 'medium',
  highContrast: false,
  reducedMotion: false,
  colorBlindnessMode: 'none',
}

interface ThemeProviderProps {
  children: ReactNode
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const [settings, setSettings] = useState<ThemeSettings>(defaultSettings)
  const [currentTheme, setCurrentTheme] = useState<'light' | 'dark'>('light')

  // Load settings from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('theme-settings')
      if (stored) {
        try {
          const parsedSettings = JSON.parse(stored)
          setSettings({ ...defaultSettings, ...parsedSettings })
        } catch (error) {
          console.error('Failed to parse stored theme settings:', error)
        }
      }
    }
  }, [])

  // Save settings to localStorage when they change
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('theme-settings', JSON.stringify(settings))
    }
  }, [settings])

  // Handle system theme changes and apply theme
  useEffect(() => {
    if (typeof window === 'undefined') return

    const applyTheme = (isDark: boolean) => {
      const root = document.documentElement
      
      if (isDark) {
        root.classList.add('dark')
        setCurrentTheme('dark')
      } else {
        root.classList.remove('dark')
        setCurrentTheme('light')
      }
    }

    const updateTheme = () => {
      if (settings.mode === 'system') {
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
        applyTheme(prefersDark)
      } else {
        applyTheme(settings.mode === 'dark')
      }
    }

    // Initial theme application
    updateTheme()

    // Listen for system theme changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    mediaQuery.addEventListener('change', updateTheme)

    return () => {
      mediaQuery.removeEventListener('change', updateTheme)
    }
  }, [settings.mode])

  // Apply font size
  useEffect(() => {
    if (typeof window === 'undefined') return

    const root = document.documentElement
    
    // Remove existing font size classes
    root.classList.remove('text-sm', 'text-base', 'text-lg', 'text-xl')
    
    // Apply new font size class
    switch (settings.fontSize) {
      case 'small':
        root.classList.add('text-sm')
        break
      case 'medium':
        root.classList.add('text-base')
        break
      case 'large':
        root.classList.add('text-lg')
        break
      case 'extra-large':
        root.classList.add('text-xl')
        break
    }
  }, [settings.fontSize])

  // Apply high contrast
  useEffect(() => {
    if (typeof window === 'undefined') return

    const root = document.documentElement
    
    if (settings.highContrast) {
      root.classList.add('high-contrast')
    } else {
      root.classList.remove('high-contrast')
    }
  }, [settings.highContrast])

  // Apply reduced motion
  useEffect(() => {
    if (typeof window === 'undefined') return

    const root = document.documentElement
    
    if (settings.reducedMotion) {
      root.classList.add('reduce-motion')
    } else {
      root.classList.remove('reduce-motion')
    }
  }, [settings.reducedMotion])

  // Apply color blindness mode
  useEffect(() => {
    if (typeof window === 'undefined') return

    const root = document.documentElement
    
    // Remove existing color blindness classes
    root.classList.remove('protanopia', 'deuteranopia', 'tritanopia')
    
    // Apply new color blindness class
    if (settings.colorBlindnessMode !== 'none') {
      root.classList.add(settings.colorBlindnessMode)
    }
  }, [settings.colorBlindnessMode])

  // Check for system preferences on mount
  useEffect(() => {
    if (typeof window === 'undefined') return

    // Check for reduced motion preference
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (prefersReducedMotion && !settings.reducedMotion) {
      setSettings(prev => ({ ...prev, reducedMotion: true }))
    }

    // Check for high contrast preference
    const prefersHighContrast = window.matchMedia('(prefers-contrast: high)').matches
    if (prefersHighContrast && !settings.highContrast) {
      setSettings(prev => ({ ...prev, highContrast: true }))
    }
  }, [])

  const setMode = (mode: ThemeMode) => {
    setSettings(prev => ({ ...prev, mode }))
  }

  const setFontSize = (fontSize: FontSize) => {
    setSettings(prev => ({ ...prev, fontSize }))
  }

  const setHighContrast = (highContrast: boolean) => {
    setSettings(prev => ({ ...prev, highContrast }))
  }

  const setReducedMotion = (reducedMotion: boolean) => {
    setSettings(prev => ({ ...prev, reducedMotion }))
  }

  const setColorBlindnessMode = (colorBlindnessMode: ColorBlindnessMode) => {
    setSettings(prev => ({ ...prev, colorBlindnessMode }))
  }

  const resetToDefaults = () => {
    setSettings(defaultSettings)
  }

  const contextValue: ThemeContextType = {
    ...settings,
    currentTheme,
    setMode,
    setFontSize,
    setHighContrast,
    setReducedMotion,
    setColorBlindnessMode,
    resetToDefaults,
  }

  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}
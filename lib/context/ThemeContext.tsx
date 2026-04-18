'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { DEFAULT_THEME } from '@/lib/themes'

interface ThemeContextType {
  currentTheme: string
  setTheme: (theme: string) => void
}

const ThemeContext = createContext<ThemeContextType>({
  currentTheme: DEFAULT_THEME,
  setTheme: () => {},
})

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [currentTheme, setCurrentTheme] = useState<string>(DEFAULT_THEME)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const stored = localStorage.getItem('aldar-theme')
    if (stored) {
      setCurrentTheme(stored)
    }
  }, [])

  useEffect(() => {
    if (mounted) {
      document.documentElement.setAttribute('data-theme', currentTheme)
      localStorage.setItem('aldar-theme', currentTheme)
    }
  }, [currentTheme, mounted])

  // Set initial theme attribute synchronously via script to prevent flash
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', currentTheme)
  }, [])

  const setTheme = (theme: string) => {
    setCurrentTheme(theme)
  }

  return (
    <ThemeContext.Provider value={{ currentTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  return useContext(ThemeContext)
}

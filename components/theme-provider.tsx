"use client"

import React, { createContext, useContext } from "react"
import { useTernaryDarkMode, type TernaryDarkMode } from "@/hooks/use-ternary-dark-mode"

interface ThemeContextValue {
  isDarkMode: boolean
  ternaryDarkMode: TernaryDarkMode
  setTernaryDarkMode: (mode: TernaryDarkMode) => void
  toggleTernaryDarkMode: () => void
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined)

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const theme = useTernaryDarkMode({
    defaultValue: "system",
    localStorageKey: "jusbro-theme",
    initializeWithValue: false, // SSR-safe for Next.js
  })

  return (
    <ThemeContext.Provider value={theme}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider")
  }
  return context
}

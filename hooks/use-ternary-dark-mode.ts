"use client"

import { Dispatch, SetStateAction, useEffect, useState, useCallback } from "react"
import { useLocalStorage } from "./use-local-storage"
import { useMediaQuery } from "./use-media-query"

export type TernaryDarkMode = "system" | "dark" | "light"

interface UseTernaryDarkModeOptions {
  defaultValue?: TernaryDarkMode
  localStorageKey?: string
  initializeWithValue?: boolean
}

interface UseTernaryDarkModeReturn {
  isDarkMode: boolean
  ternaryDarkMode: TernaryDarkMode
  setTernaryDarkMode: Dispatch<SetStateAction<TernaryDarkMode>>
  toggleTernaryDarkMode: () => void
}

export function useTernaryDarkMode(
  options: UseTernaryDarkModeOptions = {}
): UseTernaryDarkModeReturn {
  const {
    defaultValue = "system",
    localStorageKey = "ternary-dark-mode",
    initializeWithValue = false,
  } = options

  const [mode, setMode] = useLocalStorage<TernaryDarkMode>(
    localStorageKey,
    defaultValue,
    { initializeWithValue }
  )

  const prefersDark = useMediaQuery("(prefers-color-scheme: dark)", {
    initializeWithValue,
    defaultValue: false,
  })

  const isDarkMode = mode === "dark" || (mode === "system" && prefersDark)

  const toggleTernaryDarkMode = useCallback(() => {
    setMode((prevMode) => {
      if (prevMode === "light") return "system"
      if (prevMode === "system") return "dark"
      return "light"
    })
  }, [setMode])

  // Apply dark class to document root
  useEffect(() => {
    if (typeof window === "undefined") return

    const root = window.document.documentElement
    root.classList.remove("light", "dark")

    if (isDarkMode) {
      root.classList.add("dark")
    } else {
      root.classList.add("light")
    }
  }, [isDarkMode])

  return {
    isDarkMode,
    ternaryDarkMode: mode,
    setTernaryDarkMode: setMode,
    toggleTernaryDarkMode,
  }
}

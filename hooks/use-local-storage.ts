"use client"

import { useEffect, useState, useCallback, Dispatch, SetStateAction } from "react"

type SetValue<T> = Dispatch<SetStateAction<T>>

interface UseLocalStorageOptions<T> {
  serializer?: (value: T) => string
  deserializer?: (value: string) => T
  initializeWithValue?: boolean
}

export function useLocalStorage<T>(
  key: string,
  initialValue: T | (() => T),
  options: UseLocalStorageOptions<T> = {}
): [T, SetValue<T>, () => void] {
  const {
    serializer = JSON.stringify,
    deserializer = JSON.parse,
    initializeWithValue = false, // SSR-safe default
  } = options

  // Get initial value
  const getInitialValue = useCallback((): T => {
    if (typeof window === "undefined") {
      return initialValue instanceof Function ? initialValue() : initialValue
    }

    try {
      const item = window.localStorage.getItem(key)
      if (item !== null) {
        return deserializer(item)
      }
    } catch (error) {
      console.warn(`Error reading localStorage key "${key}":`, error)
    }

    return initialValue instanceof Function ? initialValue() : initialValue
  }, [key, initialValue, deserializer])

  const [storedValue, setStoredValue] = useState<T>(() => {
    if (initializeWithValue) {
      return getInitialValue()
    }
    return initialValue instanceof Function ? initialValue() : initialValue
  })

  // Initialize value on client
  useEffect(() => {
    if (!initializeWithValue && typeof window !== "undefined") {
      setStoredValue(getInitialValue())
    }
  }, [initializeWithValue, getInitialValue])

  // Set value
  const setValue: SetValue<T> = useCallback(
    (value) => {
      if (typeof window === "undefined") {
        console.warn(`Tried to set localStorage key "${key}" even though environment is not a client`)
        return
      }

      try {
        const newValue = value instanceof Function ? value(storedValue) : value
        window.localStorage.setItem(key, serializer(newValue))
        setStoredValue(newValue)

        // Dispatch storage event for cross-tab sync
        window.dispatchEvent(
          new StorageEvent("storage", {
            key,
            newValue: serializer(newValue),
          })
        )
      } catch (error) {
        console.warn(`Error setting localStorage key "${key}":`, error)
      }
    },
    [key, serializer, storedValue]
  )

  // Remove value
  const removeValue = useCallback(() => {
    if (typeof window === "undefined") {
      return
    }

    try {
      window.localStorage.removeItem(key)
      setStoredValue(initialValue instanceof Function ? initialValue() : initialValue)

      // Dispatch storage event
      window.dispatchEvent(
        new StorageEvent("storage", {
          key,
          newValue: null,
        })
      )
    } catch (error) {
      console.warn(`Error removing localStorage key "${key}":`, error)
    }
  }, [key, initialValue])

  // Listen for storage events (cross-tab sync)
  useEffect(() => {
    if (typeof window === "undefined") {
      return
    }

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key !== key || e.storageArea !== window.localStorage) {
        return
      }

      try {
        if (e.newValue !== null) {
          setStoredValue(deserializer(e.newValue))
        } else {
          setStoredValue(initialValue instanceof Function ? initialValue() : initialValue)
        }
      } catch (error) {
        console.warn(`Error syncing localStorage key "${key}":`, error)
      }
    }

    window.addEventListener("storage", handleStorageChange)
    return () => window.removeEventListener("storage", handleStorageChange)
  }, [key, initialValue, deserializer])

  return [storedValue, setValue, removeValue]
}

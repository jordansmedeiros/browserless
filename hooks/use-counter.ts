"use client"

import { Dispatch, SetStateAction, useCallback, useState } from "react"

interface UseCounterReturn {
  count: number
  increment: () => void
  decrement: () => void
  reset: () => void
  setCount: Dispatch<SetStateAction<number>>
}

export function useCounter(initialValue: number = 0): UseCounterReturn {
  const [count, setCount] = useState(initialValue)

  const increment = useCallback(() => setCount((x) => x + 1), [])
  const decrement = useCallback(() => setCount((x) => x - 1), [])
  const reset = useCallback(() => setCount(initialValue), [initialValue])

  return { count, increment, decrement, reset, setCount }
}

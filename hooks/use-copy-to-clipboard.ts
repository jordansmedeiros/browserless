"use client"

import { useState, useCallback } from "react"

type CopiedValue = string | null
type CopyFn = (text: string) => Promise<void>

export function useCopyToClipboard(): [CopyFn, boolean] {
  const [isCopied, setIsCopied] = useState(false)

  const copy: CopyFn = useCallback(async (text) => {
    if (!navigator?.clipboard) {
      console.warn("Clipboard not supported")
      return
    }

    try {
      await navigator.clipboard.writeText(text)
      setIsCopied(true)

      // Reset after 2 seconds
      setTimeout(() => {
        setIsCopied(false)
      }, 2000)
    } catch (error) {
      console.warn("Copy failed", error)
      setIsCopied(false)
    }
  }, [])

  return [copy, isCopied]
}

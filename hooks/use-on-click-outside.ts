"use client"

import { RefObject, useEffect } from "react"

type Handler = (event: MouseEvent | TouchEvent) => void

export function useOnClickOutside<T extends HTMLElement = HTMLElement>(
  ref: RefObject<T> | RefObject<T>[],
  handler: Handler,
  mouseEvent: "mousedown" | "mouseup" = "mousedown"
): void {
  useEffect(() => {
    const listener = (event: MouseEvent | TouchEvent) => {
      const refs = Array.isArray(ref) ? ref : [ref]

      // Check if click is outside all refs
      const isOutside = refs.every((r) => {
        const el = r?.current
        return !el || !el.contains(event.target as Node)
      })

      if (isOutside) {
        handler(event)
      }
    }

    document.addEventListener(mouseEvent, listener)
    document.addEventListener("touchstart", listener)

    return () => {
      document.removeEventListener(mouseEvent, listener)
      document.removeEventListener("touchstart", listener)
    }
  }, [ref, handler, mouseEvent])
}

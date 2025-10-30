"use client"

import { Search } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState, useCallback, useRef, useEffect } from "react"

import { mainNavItems } from "@/config/navigation"
import { Label } from "@/components/ui/label"
import { SidebarInput } from "@/components/ui/sidebar"
import { cn } from "@/lib/utils"

export function SearchForm({ ...props }: React.ComponentProps<"form">) {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState("")
  const [showResults, setShowResults] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const resultsRef = useRef<HTMLDivElement>(null)

  // Filter results based on search query
  const filterResults = useCallback((query: string) => {
    if (query.length < 2) return []

    const lowercaseQuery = query.toLowerCase()
    return mainNavItems.filter((item) =>
      item.title.toLowerCase().includes(lowercaseQuery) ||
      item.description?.toLowerCase().includes(lowercaseQuery)
    ).slice(0, 5)
  }, [])

  const results = filterResults(searchQuery)

  // Navigate to selected result
  const navigateToResult = useCallback((url: string) => {
    router.push(url)
    setSearchQuery("")
    setShowResults(false)
    inputRef.current?.blur()
  }, [router])

  // Handle keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showResults || results.length === 0) {
      if (e.key === "Escape") {
        setSearchQuery("")
        setShowResults(false)
      }
      return
    }

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault()
        setSelectedIndex((prev) => (prev + 1) % results.length)
        break
      case "ArrowUp":
        e.preventDefault()
        setSelectedIndex((prev) => (prev - 1 + results.length) % results.length)
        break
      case "Enter":
        e.preventDefault()
        if (results[selectedIndex]) {
          navigateToResult(results[selectedIndex].url)
        }
        break
      case "Escape":
        e.preventDefault()
        setSearchQuery("")
        setShowResults(false)
        break
    }
  }, [showResults, results, selectedIndex, navigateToResult])

  // Handle input change
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setSearchQuery(value)
    setShowResults(value.length >= 2)
    setSelectedIndex(0)
  }, [])

  // Handle input focus
  const handleFocus = useCallback(() => {
    if (searchQuery.length >= 2) {
      setShowResults(true)
    }
  }, [searchQuery])

  // Handle click outside to close results
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        resultsRef.current &&
        !resultsRef.current.contains(event.target as Node) &&
        !inputRef.current?.contains(event.target as Node)
      ) {
        setShowResults(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  // Handle form submit
  const handleSubmit = useCallback((event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
  }, [])

  return (
    <form onSubmit={handleSubmit} {...props}>
      <div className="relative">
        <Label htmlFor="search" className="sr-only">
          Pesquisar
        </Label>
        <SidebarInput
          ref={inputRef}
          id="search"
          value={searchQuery}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={handleFocus}
          placeholder="Buscar páginas..."
          className="h-8 pl-7"
        />
        <Search className="pointer-events-none absolute left-2 top-1/2 size-4 -translate-y-1/2 select-none opacity-50" />
        
        {/* Search results dropdown */}
        {showResults && (
          <div
            ref={resultsRef}
            className="absolute left-0 right-0 top-full z-50 mt-1 max-h-[300px] overflow-auto rounded-md border bg-popover p-1 text-popover-foreground shadow-md"
          >
            {results.length > 0 ? (
              results.map((item, index) => (
                <button
                  key={item.url}
                  type="button"
                  onClick={() => navigateToResult(item.url)}
                  className={cn(
                    "w-full rounded-sm px-2 py-1.5 text-left text-sm outline-none transition-colors",
                    index === selectedIndex
                      ? "bg-accent text-accent-foreground"
                      : "hover:bg-accent hover:text-accent-foreground"
                  )}
                >
                  <div className="font-medium">{item.title}</div>
                  <div className="text-xs text-muted-foreground">{item.description}</div>
                </button>
              ))
            ) : (
              <div className="px-2 py-1.5 text-sm text-muted-foreground">
                Nenhum resultado encontrado
              </div>
            )}
          </div>
        )}
      </div>
    </form>
  )
}

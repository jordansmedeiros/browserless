import { BadgeProps } from '@/components/ui/badge'
import { CheckCircle2, XCircle, Loader2, Clock, Ban } from 'lucide-react'
import type { ScrapeJobTribunal } from '@/lib/types/scraping'

/**
 * Converts grau code to friendly format
 * @param grau - The grau code (1g, 2g, unico)
 * @returns Formatted grau string
 */
export function formatGrau(grau: string): string {
  switch (grau) {
    case '1g':
      return '1º Grau'
    case '2g':
      return '2º Grau'
    case 'unico':
      return 'Instância Única'
    default:
      return grau
  }
}

/**
 * Converts grau code to short format for badges
 * @param grau - The grau code (1g, 2g, unico)
 * @returns Short formatted grau string
 */
export function formatGrauShort(grau: string): string {
  switch (grau) {
    case '1g':
      return '1G'
    case '2g':
      return '2G'
    case 'unico':
      return 'ÚN'
    default:
      return grau.toUpperCase()
  }
}

/**
 * Returns a summary string of tribunal codes
 * @param tribunals - Array of ScrapeJobTribunal
 * @param maxDisplay - Maximum number of tribunals to display before truncating
 * @returns Summary string (e.g., "TRT3, TRT15, TRT2" or "TRT3, TRT15 +2 mais")
 */
export function getTribunalSummary(
  tribunals: ScrapeJobTribunal[],
  maxDisplay: number = 3
): string {
  const codes = tribunals.map((t) => t.tribunalConfig.tribunal.codigo)

  if (codes.length <= maxDisplay) {
    return codes.join(', ')
  }

  const displayed = codes.slice(0, maxDisplay)
  const remaining = codes.length - maxDisplay
  return `${displayed.join(', ')} +${remaining} mais`
}

/**
 * Returns Badge variant based on tribunal status
 * @param status - The status string
 * @returns Badge variant and optional className
 */
export function getTribunalBadgeVariant(
  status: string
): { variant: BadgeProps['variant']; className?: string } {
  switch (status) {
    case 'completed':
      return { variant: 'default', className: 'bg-green-500' }
    case 'failed':
      return { variant: 'destructive' }
    case 'running':
      return { variant: 'default', className: 'bg-blue-500' }
    case 'pending':
      return { variant: 'secondary' }
    case 'canceled':
      return { variant: 'outline' }
    default:
      return { variant: 'secondary' }
  }
}

/**
 * Returns the appropriate status icon component
 * @param status - The status string
 * @returns Lucide icon component
 */
export function getStatusIcon(status: string) {
  switch (status) {
    case 'completed':
      return CheckCircle2
    case 'failed':
      return XCircle
    case 'running':
      return Loader2
    case 'pending':
      return Clock
    case 'canceled':
      return Ban
    default:
      return Clock
  }
}

/**
 * Formats tribunal display string for badges
 * @param tribunal - ScrapeJobTribunal object
 * @returns Formatted string (e.g., "TRT3 - 1º Grau")
 */
export function formatTribunalDisplay(tribunal: ScrapeJobTribunal): string {
  const codigo = tribunal.tribunalConfig.tribunal.codigo
  const grau = formatGrau(tribunal.tribunalConfig.grau)
  return `${codigo} - ${grau}`
}

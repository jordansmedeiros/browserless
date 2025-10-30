'use client';

import { usePathname } from 'next/navigation';
import { useMemo } from 'react';

export interface BreadcrumbItem {
  label: string;
  href: string;
  isCurrentPage: boolean;
}

const ROUTE_LABELS: Record<string, string> = {
  dashboard: 'Dashboard',
  pje: 'PJE',
  credentials: 'Credenciais',
  scrapes: 'Raspagens',
  processos: 'Processos',
  settings: 'Configurações',
  profile: 'Perfil',
  reports: 'Relatórios',
  analytics: 'Análises',
};

/**
 * Checks if a segment looks like an ID or UUID.
 * This is now more restrictive to avoid misinterpreting valid path segments.
 */
function isIdOrUuid(segment: string): boolean {
  // Check for UUID pattern
  const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (uuidPattern.test(segment)) return true;

  // Check for numeric ID
  if (/^\d+$/.test(segment)) return true;

  return false;
}

/**
 * Converts a string to title case
 */
function toTitleCase(str: string): string {
  return str
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

/**
 * Formats a segment into a readable label
 */
function formatSegmentLabel(segment: string): string {
  if (isIdOrUuid(segment)) {
    return 'Detalhes';
  }

  let decodedSegment = segment;
  try {
    // Decode URI component, falling back to original segment on error
    decodedSegment = decodeURIComponent(segment);
  } catch (error) {
    // Malformed URI segment, use as-is.
  }

  // Replace hyphens and underscores with spaces
  const withSpaces = decodedSegment.replace(/[-_]/g, ' ');

  // Apply title case
  return toTitleCase(withSpaces);
}

export function useBreadcrumbs(): BreadcrumbItem[] {
  const pathname = usePathname();

  return useMemo(() => {
    // Normalize pathname by removing trailing slashes
    const normalizedPath = pathname.replace(/\/$/, '') || '/';

    // Handle root or dashboard path, which are treated as the same
    if (normalizedPath === '/' || normalizedPath === '/dashboard') {
      return [
        {
          label: 'Dashboard',
          href: '/dashboard',
          isCurrentPage: true,
        },
      ];
    }

    const allSegments = normalizedPath.split('/').filter(Boolean);

    const breadcrumbs: BreadcrumbItem[] = [
      {
        label: 'Dashboard',
        href: '/dashboard',
        isCurrentPage: false,
      },
    ];

    // If the path starts with /dashboard, we skip that segment in our loop
    // and start building the cumulative path from there.
    const segmentsToProcess =
      allSegments[0] === 'dashboard' ? allSegments.slice(1) : allSegments;
    let cumulativePath =
      allSegments[0] === 'dashboard' ? '/dashboard' : '';

    segmentsToProcess.forEach((segment, index) => {
      cumulativePath += `/${segment}`;
      const isLast = index === segmentsToProcess.length - 1;

      const label = ROUTE_LABELS[segment] || formatSegmentLabel(segment);

      breadcrumbs.push({
        label,
        href: cumulativePath,
        isCurrentPage: isLast,
      });
    });

    return breadcrumbs;
  }, [pathname]);
}

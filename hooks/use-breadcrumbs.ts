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
 * Checks if a segment looks like an ID or UUID
 */
function isIdOrUuid(segment: string): boolean {
  // Check for UUID pattern
  const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (uuidPattern.test(segment)) return true;

  // Check for numeric ID
  if (/^\d+$/.test(segment)) return true;

  // Check for short alphanumeric ID (less than 6 chars, all lowercase or uppercase)
  if (segment.length <= 6 && /^[a-z0-9]+$/i.test(segment) && segment === segment.toLowerCase()) return true;

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
  // Check if it's an ID or UUID
  if (isIdOrUuid(segment)) {
    return 'Detalhes';
  }

  // Decode URI component
  const decoded = decodeURIComponent(segment);

  // Replace hyphens and underscores with spaces
  const withSpaces = decoded.replace(/[-_]/g, ' ');

  // Apply title case
  return toTitleCase(withSpaces);
}

export function useBreadcrumbs(): BreadcrumbItem[] {
  const pathname = usePathname();

  return useMemo(() => {
    // Normalize pathname by removing trailing slashes
    const normalizedPath = pathname.replace(/\/$/, '') || '/';

    // Handle root or empty path
    if (normalizedPath === '/' || normalizedPath === '/dashboard') {
      return [
        {
          label: 'Dashboard',
          href: '/dashboard',
          isCurrentPage: true,
        },
      ];
    }

    // Split pathname into segments and filter out empty strings
    const segments = normalizedPath.split('/').filter(Boolean);

    // Build breadcrumb items
    const breadcrumbs: BreadcrumbItem[] = [
      {
        label: 'Dashboard',
        href: '/dashboard',
        isCurrentPage: false,
      },
    ];
    let cumulativePath = '';

    segments.forEach((segment, index) => {
      cumulativePath += `/${segment}`;
      const isLast = index === segments.length - 1;

      // Get label from mapping or use formatted segment
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

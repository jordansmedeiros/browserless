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

      // Get label from mapping or use segment as fallback (capitalize first letter)
      const label =
        ROUTE_LABELS[segment] ||
        segment.charAt(0).toUpperCase() + segment.slice(1);

      breadcrumbs.push({
        label,
        href: cumulativePath,
        isCurrentPage: isLast,
      });
    });

    return breadcrumbs;
  }, [pathname]);
}

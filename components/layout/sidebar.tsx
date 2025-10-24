'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, FileText, LogIn, List } from 'lucide-react';
import { cn } from '@/lib/utils';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: Home },
  { name: 'Login PJE', href: '/pje/login', icon: LogIn },
  { name: 'Processos', href: '/pje/processos', icon: FileText },
  { name: 'Raspagens', href: '/pje/scrapes', icon: List },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <div className="flex h-full w-64 flex-col bg-gray-50 dark:bg-gray-900">
      <div className="flex h-16 items-center border-b px-6">
        <h1 className="text-xl font-bold">Browserless PJE</h1>
      </div>
      <nav className="flex-1 space-y-1 px-3 py-4">
        {navigation.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-gray-100 dark:hover:bg-gray-800'
              )}
            >
              <Icon className="h-5 w-5" />
              {item.name}
            </Link>
          );
        })}
      </nav>
      <div className="border-t p-4">
        <p className="text-xs text-muted-foreground">
          Browserless v2.37.1
        </p>
        <p className="text-xs text-muted-foreground">
          PJE TRT3 Automation
        </p>
      </div>
    </div>
  );
}

'use client';

/**
 * Realtime Indicator Component
 * Botão de atualização manual para o dashboard
 */

import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';

interface RealtimeIndicatorProps {
  onRefresh?: () => void;
  refreshing?: boolean;
}

/**
 * Componente de botão de refresh
 */
export function RealtimeIndicator({
  onRefresh,
  refreshing = false,
}: RealtimeIndicatorProps) {
  return (
    <Button
      variant="outline"
      size="sm"
      onClick={onRefresh}
      disabled={refreshing}
      className="gap-2"
    >
      <RefreshCw className={cn('h-4 w-4', refreshing && 'animate-spin')} />
      <span>{refreshing ? 'Atualizando...' : 'Atualizar'}</span>
    </Button>
  );
}


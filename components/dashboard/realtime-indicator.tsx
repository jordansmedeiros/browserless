'use client';

/**
 * Realtime Indicator Component
 * Indicador de status de conexão em tempo real
 */

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { RefreshCw, Wifi, WifiOff } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/lib/utils';

interface RealtimeIndicatorProps {
  isPolling?: boolean;
  lastUpdate?: number;
  onRefresh?: () => void;
  refreshing?: boolean;
}

const pulseVariants = {
  animate: {
    scale: [1, 1.2, 1],
    opacity: [0.8, 0, 0.8],
  },
  transition: {
    duration: 2,
    repeat: Infinity,
    ease: 'easeInOut',
  },
};

/**
 * Componente de indicador de conexão em tempo real
 */
export function RealtimeIndicator({
  isPolling = false,
  lastUpdate,
  onRefresh,
  refreshing = false,
}: RealtimeIndicatorProps) {
  const timeAgo = lastUpdate
    ? getRelativeTime(new Date(lastUpdate))
    : null;

  return (
    <div className="flex items-center gap-2">
      {/* Indicador de status */}
      <div className="flex items-center gap-2">
        {isPolling ? (
          <Badge variant="default" className="gap-2">
            <motion.div
              animate="animate"
              variants={pulseVariants}
              className="relative w-2 h-2 rounded-full bg-green-500"
            />
            <span className="text-xs">Conectado</span>
          </Badge>
        ) : (
          <Badge variant="secondary" className="gap-2">
            <WifiOff className="h-3 w-3" />
            <span className="text-xs">Desconectado</span>
          </Badge>
        )}
      </div>

      {/* Última atualização */}
      {lastUpdate && timeAgo && (
        <span className="text-xs text-muted-foreground">Atualizado {timeAgo}</span>
      )}

      {/* Botão de refresh */}
      {onRefresh && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onRefresh}
          disabled={refreshing}
          className="h-8"
        >
          <RefreshCw className={cn('h-3 w-3', refreshing && 'animate-spin')} />
        </Button>
      )}
    </div>
  );
}

/**
 * Formatar tempo relativo
 */
function getRelativeTime(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);

  if (seconds < 10) return 'agora';
  if (seconds < 60) return `${seconds}s atrás`;
  
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}min atrás`;
  
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h atrás`;
  
  const days = Math.floor(hours / 24);
  return `${days}d atrás`;
}


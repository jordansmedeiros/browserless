/**
 * Terminal Monitor Fallback Component
 * Visual fallback when SSE is not available
 */

'use client';

import { useEffect, useState } from 'react';
import { Terminal, TypingAnimation } from '@/components/ui/shadcn-io/terminal';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Loader2 } from 'lucide-react';
import type { JobSummary } from '@/lib/stores';

interface TerminalMonitorFallbackProps {
  /** Scrape job ID */
  jobId: string;
  /** Job statistics */
  stats: JobSummary | null;
}

const MESSAGES = [
  'Iniciando raspagem...',
  'Conectando ao tribunal...',
  'Autenticando credenciais...',
  'Raspando processos...',
  'Processando dados...',
  'Finalizando raspagem...',
];

export function TerminalMonitorFallback({ jobId, stats }: TerminalMonitorFallbackProps) {
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);
  const [displayedLogs, setDisplayedLogs] = useState<string[]>([]);

  // Calculate progress based on stats
  const progress = stats
    ? Math.round((stats.completedTribunals / (stats.totalTribunals || 1)) * 100)
    : 0;

  // Cycle through messages
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentMessageIndex((prev) => {
        const nextIndex = (prev + 1) % MESSAGES.length;

        // Add message to displayed logs
        setDisplayedLogs((logs) => {
          const newLogs = [...logs, MESSAGES[prev]];
          // Keep only last 10 messages
          return newLogs.slice(-10);
        });

        return nextIndex;
      });
    }, 3000); // Change message every 3 seconds

    return () => clearInterval(interval);
  }, []);

  // Generate message based on stats
  const getCurrentMessage = (): string => {
    if (!stats) return MESSAGES[currentMessageIndex];

    if (stats.completedTribunals > 0 && stats.totalTribunals > 0) {
      return `Raspando processos... (${stats.completedTribunals} de ${stats.totalTribunals} tribunais concluídos)`;
    }

    return MESSAGES[currentMessageIndex];
  };

  return (
    <div className="space-y-4">
      {/* Progress indicator */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin text-primary" />
            <span className="text-muted-foreground">Processando...</span>
          </div>
          <span className="text-muted-foreground">{progress}%</span>
        </div>
        <Progress value={progress} />
      </div>

      {/* Terminal with simulated logs */}
      <Terminal className="max-h-[500px] w-full max-w-full">
        <div className="max-h-[400px] overflow-y-auto space-y-1">
          {/* Show skeleton loaders for simulated activity */}
          {displayedLogs.map((log, index) => (
            <div key={index} className="flex items-center gap-2 py-1">
              <span className="text-gray-400 text-xs">
                [{new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}]
              </span>
              <span className="text-gray-300">{log}</span>
            </div>
          ))}

          {/* Current message with typing animation */}
          <div className="flex items-center gap-2 py-1">
            <span className="text-gray-400 text-xs">
              [{new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}]
            </span>
            <TypingAnimation duration={60} className="text-primary">
              {getCurrentMessage()}
            </TypingAnimation>
          </div>

          {/* Simulated log lines as skeletons */}
          <div className="space-y-2 mt-4">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-5/6" />
          </div>

          {/* Blinking cursor */}
          <div className="flex items-center gap-2 py-1">
            <span className="text-primary animate-pulse">▊</span>
          </div>
        </div>
      </Terminal>

      {/* Footer with stats */}
      {stats && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Loader2 className="h-3 w-3 animate-spin text-primary" />
            <span>Processando tribunais...</span>
          </div>
          <div className="flex items-center gap-4">
            {stats.completedTribunals > 0 && (
              <span>
                {stats.completedTribunals} / {stats.totalTribunals} tribunais
              </span>
            )}
            {stats.totalProcesses > 0 && (
              <span>{stats.totalProcesses} processos</span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

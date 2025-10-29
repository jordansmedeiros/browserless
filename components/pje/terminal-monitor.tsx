/**
 * Terminal Monitor Component
 * Real-time log display for scrape jobs
 */

'use client';

import { useState, useRef, useMemo } from 'react';
import { Terminal, AnimatedSpan, TypingAnimation } from '@/components/ui/shadcn-io/terminal';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowDown, AlertCircle, CheckCircle2, Loader2, Clock, FileText, TrendingUp, XCircle, Download } from 'lucide-react';
import { type LogEntry } from '@/lib/services/scrape-logger';
import { useJobLogs } from '@/hooks';
import { sanitizeLogEntry } from '@/lib/utils/sanitization';

interface TerminalMonitorProps {
  /** Scrape job ID */
  jobId: string;
  /** Whether job is currently running */
  isRunning?: boolean;
  /** Initial logs (for historical viewing) */
  initialLogs?: LogEntry[];
}

export function TerminalMonitor({ jobId, isRunning = false, initialLogs = [] }: TerminalMonitorProps) {
  const [autoScroll, setAutoScroll] = useState(true);

  const terminalRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Use custom hook for logs management
  const { logs, connectionStatus, stats, scrollToBottom: hookScrollToBottom, downloadLogs: hookDownloadLogs } = useJobLogs(jobId, {
    enabled: isRunning,
    autoScroll,
  });

  // Use initialLogs if logs are empty (for historical viewing)
  const displayLogs = logs.length > 0 ? logs : initialLogs;
  const jobSummary = stats;
  const jobStatus = stats?.status || 'running';

  // Memoize sanitized logs for performance
  const sanitizedLogs = useMemo(
    () => displayLogs.map(sanitizeLogEntry),
    [displayLogs]
  );

  // Detect manual scroll to disable auto-scroll
  const handleScroll = () => {
    if (!scrollContainerRef.current) return;

    const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
    const isAtBottom = scrollHeight - scrollTop - clientHeight < 10; // 10px threshold

    if (autoScroll && !isAtBottom) {
      setAutoScroll(false);
    }
  };

  // Scroll to bottom manually
  const scrollToBottom = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
      setAutoScroll(true);
    }
    hookScrollToBottom();
  };

  // Get log color by level
  const getLogColor = (level: LogEntry['level']) => {
    switch (level) {
      case 'success':
        return 'text-green-400';
      case 'error':
        return 'text-red-400';
      case 'warn':
        return 'text-yellow-400';
      default:
        return 'text-gray-300';
    }
  };

  // Format timestamp
  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  // Format duration
  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (mins === 0) return `${secs}s`;
    return `${mins}m ${secs}s`;
  };

  // Calculate success rate
  const getSuccessRate = (): number => {
    if (!jobSummary || jobSummary.totalTribunals === 0) return 0;
    return Math.round((jobSummary.completedTribunals / jobSummary.totalTribunals) * 100);
  };

  return (
    <div className="space-y-4" ref={terminalRef}>
      {/* Job Completion Summary */}
      {jobSummary && (jobStatus === 'completed' || jobStatus === 'failed') && (
        <Card className={jobStatus === 'completed' ? 'border-green-500' : 'border-red-500'}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {jobStatus === 'completed' ? (
                <>
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                  Raspagem Concluída
                </>
              ) : (
                <>
                  <XCircle className="h-5 w-5 text-red-500" />
                  Raspagem Falhou
                </>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <FileText className="h-4 w-4" />
                  <span>Processos</span>
                </div>
                <p className="text-2xl font-bold">{jobSummary.totalProcesses}</p>
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <TrendingUp className="h-4 w-4" />
                  <span>Taxa de Sucesso</span>
                </div>
                <p className="text-2xl font-bold">{getSuccessRate()}%</p>
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  <span>Duração</span>
                </div>
                <p className="text-2xl font-bold">
                  {jobSummary.duration ? formatDuration(jobSummary.duration) : '-'}
                </p>
              </div>
              <div className="space-y-1">
                <div className="text-sm text-muted-foreground">Tribunais</div>
                <p className="text-lg font-semibold">
                  <span className="text-green-500">{jobSummary.completedTribunals}</span>
                  {' / '}
                  <span className="text-red-500">{jobSummary.failedTribunals}</span>
                  {' / '}
                  <span className="text-muted-foreground">{jobSummary.totalTribunals}</span>
                </p>
                <p className="text-xs text-muted-foreground">
                  sucesso / falha / total
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Connection Status */}
      {connectionStatus === 'error' && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Erro ao conectar com o servidor de logs. Tentando reconectar...
          </AlertDescription>
        </Alert>
      )}

      {/* Terminal */}
      <div className="relative">
        <Terminal className="max-h-[500px] w-full max-w-full">
          <div
            ref={scrollContainerRef}
            onScroll={handleScroll}
            className="max-h-[400px] overflow-y-auto"
          >
            {sanitizedLogs.length === 0 && (
              <div className="text-muted-foreground">
                {isRunning ? (
                  <TypingAnimation duration={60}>Aguardando logs...</TypingAnimation>
                ) : (
                  'Nenhum log disponível'
                )}
              </div>
            )}

            {sanitizedLogs.map((log, index) => (
              <AnimatedSpan key={index} delay={index * 50} className="font-mono">
                <span className={getLogColor(log.level)}>
                  [{formatTime(log.timestamp)}]
                </span>
                <span className="ml-2">{log.message}</span>
                {log.context && (
                  <span className="ml-2 text-muted-foreground text-xs">
                    {JSON.stringify(log.context)}
                  </span>
                )}
              </AnimatedSpan>
            ))}

            {isRunning && (
              <AnimatedSpan delay={displayLogs.length * 50}>
                <TypingAnimation duration={60} className="text-primary">
                  ▊
                </TypingAnimation>
              </AnimatedSpan>
            )}
          </div>
        </Terminal>

        {/* Scroll to bottom button */}
        {!autoScroll && (
          <Button
            size="sm"
            variant="secondary"
            className="absolute bottom-4 right-4"
            onClick={scrollToBottom}
          >
            <ArrowDown className="h-4 w-4 mr-2" />
            Ir para o final
          </Button>
        )}
      </div>

      {/* Status Footer */}
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <div className="flex items-center gap-2">
          {connectionStatus === 'connected' && (
            <>
              <Loader2 className="h-3 w-3 animate-spin text-primary" />
              <span>Streaming ao vivo</span>
            </>
          )}
          {connectionStatus === 'disconnected' && jobStatus === 'completed' && (
            <>
              <CheckCircle2 className="h-3 w-3 text-green-500" />
              <span>Concluído com sucesso</span>
            </>
          )}
          {connectionStatus === 'disconnected' && jobStatus === 'failed' && (
            <>
              <XCircle className="h-3 w-3 text-red-500" />
              <span>Falhou</span>
            </>
          )}
          {connectionStatus === 'connecting' && (
            <>
              <Loader2 className="h-3 w-3 animate-spin" />
              <span>Conectando...</span>
            </>
          )}
        </div>
        <div className="flex items-center gap-4">
          {jobSummary && jobSummary.totalProcesses > 0 && (
            <span>{jobSummary.totalProcesses} processos</span>
          )}
          <span>{displayLogs.length} {displayLogs.length === 1 ? 'log' : 'logs'}</span>
          {displayLogs.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={hookDownloadLogs}
              className="h-7 gap-2"
            >
              <Download className="h-3 w-3" />
              Download Logs
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

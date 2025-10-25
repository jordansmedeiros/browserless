/**
 * Scrape Execution Detail Component
 * Detailed view of a single execution with logs and results
 */

'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Loader2,
  Download,
  AlertCircle,
  CheckCircle2,
  Clock,
  FileText,
  Terminal,
  RotateCw,
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { getScrapeExecutionAction, retryScrapeExecutionAction } from '@/app/actions/pje';
import type { ScrapeExecutionDetails } from '@/lib/types/scraping';
import { useToast } from '@/hooks/use-toast';

interface ScrapeExecutionDetailProps {
  /** Execution ID to display */
  executionId: string;
}

export function ScrapeExecutionDetail({ executionId }: ScrapeExecutionDetailProps) {
  const [execution, setExecution] = useState<ScrapeExecutionDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showAllProcesses, setShowAllProcesses] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchExecution();
  }, [executionId]);

  const fetchExecution = async () => {
    setIsLoading(true);
    try {
      const result = await getScrapeExecutionAction(executionId);

      if (result.success && result.data) {
        setExecution(result.data);
      }
    } catch (error) {
      console.error('Error fetching execution:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const exportJSON = () => {
    if (!execution?.resultData) return;

    const dataStr = JSON.stringify(execution.resultData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `execution-${executionId}-${Date.now()}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleRetry = async () => {
    if (!execution || execution.status !== 'failed') return;

    setIsRetrying(true);
    try {
      const result = await retryScrapeExecutionAction(executionId);

      if (result.success) {
        toast({
          title: 'Execução reenfileirada',
          description: 'A execução foi adicionada à fila novamente e será reprocessada.',
        });

        // Refresh execution data after a short delay
        setTimeout(() => {
          fetchExecution();
        }, 1000);
      } else {
        toast({
          title: 'Erro ao reexecutar',
          description: result.error || 'Não foi possível reexecutar esta execução.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error retrying execution:', error);
      toast({
        title: 'Erro ao reexecutar',
        description: 'Ocorreu um erro inesperado.',
        variant: 'destructive',
      });
    } finally {
      setIsRetrying(false);
    }
  };

  const formatDate = (date: Date | string): string => {
    const d = typeof date === 'string' ? new Date(date) : date;
    return format(d, "dd/MM/yyyy 'às' HH:mm:ss", { locale: ptBR });
  };

  const formatDuration = (start: Date | string, end: Date | string | null): string => {
    if (!end) return 'Em andamento...';

    const startTime = typeof start === 'string' ? new Date(start) : start;
    const endTime = typeof end === 'string' ? new Date(end) : end;
    const durationMs = endTime.getTime() - startTime.getTime();

    const seconds = Math.floor(durationMs / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (hours > 0) {
      return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else {
      return `${seconds}s`;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary">Aguardando</Badge>;
      case 'running':
        return (
          <Badge variant="default" className="bg-blue-500">
            <Loader2 className="mr-1 h-3 w-3 animate-spin" />
            Em Execução
          </Badge>
        );
      case 'completed':
        return <Badge variant="default" className="bg-green-500">Concluído</Badge>;
      case 'failed':
        return <Badge variant="destructive">Falhou</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!execution) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="py-12 text-center text-sm text-muted-foreground">
            Execução não encontrada
          </div>
        </CardContent>
      </Card>
    );
  }

  const processos = execution.resultDataDecoded?.processos || [];
  const displayedProcessos = showAllProcesses ? processos : processos.slice(0, 10);

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle>Detalhes da Execução</CardTitle>
              <CardDescription>
                Tribunal: {execution.tribunalConfig?.id || 'N/A'}
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              {getStatusBadge(execution.status)}
              {execution.status === 'failed' && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRetry}
                  disabled={isRetrying}
                >
                  {isRetrying ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Reenfileirando...
                    </>
                  ) : (
                    <>
                      <RotateCw className="mr-2 h-4 w-4" />
                      Tentar Novamente
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Início</p>
              <p className="text-sm">{execution.startedAt ? formatDate(execution.startedAt) : 'Não iniciado'}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Fim</p>
              <p className="text-sm">
                {execution.completedAt ? formatDate(execution.completedAt) : 'Em andamento'}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Duração</p>
              <p className="text-sm font-mono">
                {execution.startedAt ? formatDuration(execution.startedAt, execution.completedAt) : 'N/A'}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Processos</p>
              <p className="text-2xl font-bold">{execution.processosCount || 0}</p>
            </div>
          </div>

          {execution.errorMessage && (
            <div className="rounded-md bg-destructive/10 p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-destructive mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-destructive">Erro na execução</p>
                  <p className="text-sm text-destructive/80 mt-1">{execution.errorMessage}</p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Execution Logs */}
      {execution.executionLogs && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Terminal className="h-5 w-5" />
              <CardTitle>Logs de Execução</CardTitle>
            </div>
            <CardDescription>Output do script de raspagem</CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[300px] w-full rounded-md border">
              <pre className="p-4 text-xs font-mono whitespace-pre-wrap">{execution.executionLogs}</pre>
            </ScrollArea>
          </CardContent>
        </Card>
      )}

      {/* Process Results */}
      {processos.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                <CardTitle>Processos Raspados</CardTitle>
              </div>
              <Button variant="outline" size="sm" onClick={exportJSON}>
                <Download className="mr-2 h-4 w-4" />
                Exportar JSON
              </Button>
            </div>
            <CardDescription>
              {processos.length} {processos.length === 1 ? 'processo encontrado' : 'processos encontrados'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              {displayedProcessos.map((processo, index) => (
                <div
                  key={processo.numeroProcesso || index}
                  className="rounded-md border p-3 text-sm"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 space-y-1">
                      <p className="font-medium font-mono">{processo.numeroProcesso}</p>
                      {processo.nomeParteAutora && (
                        <p className="text-muted-foreground">
                          <span className="font-medium">Autor:</span> {processo.nomeParteAutora}
                        </p>
                      )}
                      {processo.nomeParteRe && (
                        <p className="text-muted-foreground">
                          <span className="font-medium">Réu:</span> {processo.nomeParteRe}
                        </p>
                      )}
                      {processo.dataDistribuicao && (
                        <p className="text-xs text-muted-foreground">
                          Distribuído em: {new Date(processo.dataDistribuicao).toLocaleDateString('pt-BR')}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {processos.length > 10 && (
              <div className="flex justify-center">
                <Button
                  variant="outline"
                  onClick={() => setShowAllProcesses(!showAllProcesses)}
                >
                  {showAllProcesses
                    ? 'Mostrar menos'
                    : `Ver todos (${processos.length - 10} restantes)`}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

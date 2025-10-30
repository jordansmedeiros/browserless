/**
 * Scrape Job Header Component
 * Displays job metadata and action buttons
 */

'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { Calendar, Clock, CheckCircle2, XCircle, Loader2, FileDown, RotateCcw } from 'lucide-react';
import type { ScrapeJobWithRelations } from '@/lib/types/scraping';
import { formatGrau, formatGrauShort, getTribunalBadgeVariant, formatTribunalDisplay } from '@/lib/utils/format-helpers';

interface ScrapeJobHeaderProps {
  job: ScrapeJobWithRelations;
  onExportCSV?: () => void;
  onExportJSON?: () => void;
  onExportExcel?: () => void;
  onRetryFailed?: () => void;
}

export function ScrapeJobHeader({ job, onExportCSV, onExportJSON, onExportExcel, onRetryFailed }: ScrapeJobHeaderProps) {
  // Calculate statistics
  const totalTribunals = job.tribunals?.length || 0;
  const completedTribunals = job.tribunals?.filter(t => t.status === 'completed').length || 0;
  const failedTribunals = job.tribunals?.filter(t => t.status === 'failed').length || 0;
  const totalProcesses = job.executions?.reduce((sum, exec) => sum + (exec.processosCount || 0), 0) || 0;
  const successRate = totalTribunals > 0 ? Math.round((completedTribunals / totalTribunals) * 100) : 0;

  // Calculate duration
  let duration: string | null = null;
  if (job.startedAt && job.completedAt) {
    const durationMs = new Date(job.completedAt).getTime() - new Date(job.startedAt).getTime();
    const durationSec = Math.floor(durationMs / 1000);
    const mins = Math.floor(durationSec / 60);
    const secs = durationSec % 60;
    duration = mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
  }

  // Format dates
  const formatDate = (date: Date | string | null | undefined) => {
    if (!date) return '-';
    return new Date(date).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Get status badge
  const getStatusBadge = () => {
    switch (job.status) {
      case 'completed':
        return (
          <Badge variant="default" className="bg-green-500">
            <CheckCircle2 className="mr-1 h-3 w-3" />
            Concluído
          </Badge>
        );
      case 'failed':
        return (
          <Badge variant="destructive">
            <XCircle className="mr-1 h-3 w-3" />
            Falhou
          </Badge>
        );
      case 'running':
        return (
          <Badge variant="default" className="bg-blue-500">
            <Loader2 className="mr-1 h-3 w-3 animate-spin" />
            Em Execução
          </Badge>
        );
      case 'pending':
        return <Badge variant="secondary">Aguardando</Badge>;
      case 'canceled':
        return <Badge variant="outline">Cancelado</Badge>;
      default:
        return <Badge>{job.status}</Badge>;
    }
  };

  // Get scrape type label
  const getScrapeTypeLabel = () => {
    switch (job.scrapeType) {
      case 'acervo_geral':
        return 'Acervo Geral';
      case 'pendentes':
        return 'Pendentes de Manifestação';
      case 'arquivados':
        return 'Processos Arquivados';
      case 'minha_pauta':
        return 'Minha Pauta';
      default:
        return job.scrapeType;
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="space-y-1">
            <CardTitle className="text-2xl">{getScrapeTypeLabel()}</CardTitle>
            <p className="text-sm text-muted-foreground">
              ID: {job.id.slice(0, 8)}...{job.id.slice(-4)}
            </p>
          </div>
          {getStatusBadge()}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Statistics Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Processos Raspados</p>
            <p className="text-2xl font-bold">{totalProcesses.toLocaleString('pt-BR')}</p>
          </div>
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Taxa de Sucesso</p>
            <p className="text-2xl font-bold">{successRate}%</p>
          </div>
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Tribunais</p>
            <p className="text-lg font-semibold">
              <span className="text-green-500">{completedTribunals}</span>
              {' / '}
              <span className="text-red-500">{failedTribunals}</span>
              {' / '}
              <span className="text-muted-foreground">{totalTribunals}</span>
            </p>
            <p className="text-xs text-muted-foreground">sucesso / falha / total</p>
          </div>
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Duração</p>
            <p className="text-2xl font-bold">{duration || '-'}</p>
          </div>
        </div>

        {/* Dates */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
          <div className="flex items-center gap-2 text-sm">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">Criado:</span>
            <span className="font-medium">{formatDate(job.createdAt)}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">Concluído:</span>
            <span className="font-medium">{formatDate(job.completedAt)}</span>
          </div>
        </div>

        {/* Tribunais Raspados */}
        {job.tribunals && job.tribunals.length > 0 && (
          <div className="space-y-2 pt-4 border-t">
            <p className="text-sm font-medium">Tribunais Raspados</p>
            <TooltipProvider>
              <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
                {job.tribunals.filter(t => t.tribunalConfig?.tribunal).map((tribunal) => {
                  const badgeConfig = getTribunalBadgeVariant(tribunal.status);
                  return (
                    <Tooltip key={tribunal.id}>
                      <TooltipTrigger asChild>
                        <Badge
                          variant={badgeConfig.variant}
                          className={badgeConfig.className}
                        >
                          {tribunal.tribunalConfig.tribunal.codigo} - {formatGrauShort(tribunal.tribunalConfig.grau)}
                        </Badge>
                      </TooltipTrigger>
                      <TooltipContent>
                        <div className="space-y-1">
                          <p className="font-semibold">{tribunal.tribunalConfig.tribunal.nome}</p>
                          <p className="text-xs">Região: {tribunal.tribunalConfig.tribunal.regiao} - {tribunal.tribunalConfig.tribunal.uf}</p>
                          <p className="text-xs">Grau: {formatGrau(tribunal.tribunalConfig.grau)}</p>
                          <p className="text-xs">Status: {tribunal.status}</p>
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  );
                })}
              </div>
            </TooltipProvider>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-2 items-center pt-4 border-t">
          <Button variant="outline" size="sm" onClick={onExportCSV} disabled={totalProcesses === 0}>
            <FileDown className="mr-2 h-4 w-4" />
            Exportar CSV
          </Button>
          <Button variant="outline" size="sm" onClick={onExportJSON} disabled={totalProcesses === 0}>
            <FileDown className="mr-2 h-4 w-4" />
            Exportar JSON
          </Button>
          <Button variant="outline" size="sm" onClick={onExportExcel} disabled={totalProcesses === 0}>
            <FileDown className="mr-2 h-4 w-4" />
            Exportar Excel
          </Button>
          {failedTribunals > 0 && (
            <Button variant="outline" size="sm" onClick={onRetryFailed}>
              <RotateCcw className="mr-2 h-4 w-4" />
              Retentar Falhas ({failedTribunals})
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

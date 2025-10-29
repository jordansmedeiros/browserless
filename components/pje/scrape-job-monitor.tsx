/**
 * Scrape Job Monitor Component
 * Real-time monitoring of active scraping jobs
 */

'use client';

import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { Loader2, X, ChevronDown, ChevronRight, Circle, Terminal } from 'lucide-react';
import { getActiveJobsStatusAction, cancelScrapeJobAction } from '@/app/actions/pje';
import type { ScrapeJobWithRelations } from '@/lib/types/scraping';

interface ScrapeJobMonitorProps {
  /** Callback when jobs are updated */
  onJobsUpdate?: (jobs: ScrapeJobWithRelations[]) => void;
  /** Initial job IDs to monitor (optional) */
  initialJobIds?: string[];
  /** Enable/disable auto-refresh polling (default: true) */
  autoRefresh?: boolean;
  /** Callback when user clicks "View Terminal" */
  onViewTerminal?: (jobId: string) => void;
}

export function ScrapeJobMonitor({ onJobsUpdate, initialJobIds, autoRefresh = true, onViewTerminal }: ScrapeJobMonitorProps) {
  const [jobs, setJobs] = useState<ScrapeJobWithRelations[]>([]);
  const [expandedJobs, setExpandedJobs] = useState<Set<string>>(new Set());
  const [cancelingJobs, setCancelingJobs] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);

  // Use refs to track latest values without triggering re-renders
  const onJobsUpdateRef = useRef(onJobsUpdate);
  const initialJobIdsRef = useRef(initialJobIds);
  const jobsRef = useRef<ScrapeJobWithRelations[]>([]);

  // Update refs when props change
  useEffect(() => {
    onJobsUpdateRef.current = onJobsUpdate;
  }, [onJobsUpdate]);

  useEffect(() => {
    initialJobIdsRef.current = initialJobIds;
  }, [initialJobIds]);

  // Polling for active jobs
  useEffect(() => {
    let intervalId: NodeJS.Timeout;

    const fetchActiveJobs = async () => {
      try {
        const jobIds = initialJobIdsRef.current || jobsRef.current.map((j) => j.id);

        if (jobIds.length === 0 && !initialJobIdsRef.current) {
          // No jobs to monitor yet
          setIsLoading(false);
          return;
        }

        const result = await getActiveJobsStatusAction(jobIds);

        if (result.success && result.data) {
          const activeJobs = result.data.filter(
            (j) => j.status === 'pending' || j.status === 'running'
          );

          setJobs(activeJobs);
          jobsRef.current = activeJobs; // Keep ref synchronized
          onJobsUpdateRef.current?.(activeJobs);

          // Stop polling only if monitoring specific job IDs and they're all done
          if (activeJobs.length === 0 && initialJobIdsRef.current && intervalId) {
            clearInterval(intervalId);
          }
          // If not monitoring specific IDs, keep polling to detect new jobs
        }
      } catch (error) {
        console.error('Error fetching active jobs:', error);
      } finally {
        setIsLoading(false);
      }
    };

    // Initial fetch
    fetchActiveJobs();

    // Only poll if autoRefresh is enabled
    if (autoRefresh) {
      intervalId = setInterval(fetchActiveJobs, 3000);
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
    // jobsRef is used instead of jobs to avoid re-renders while keeping fresh IDs
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoRefresh]);

  const toggleExpand = (jobId: string) => {
    setExpandedJobs((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(jobId)) {
        newSet.delete(jobId);
      } else {
        newSet.add(jobId);
      }
      return newSet;
    });
  };

  const handleCancelJob = async (jobId: string) => {
    setCancelingJobs((prev) => new Set(prev).add(jobId));

    try {
      const result = await cancelScrapeJobAction(jobId);

      if (result.success) {
        // Job will be removed on next poll
      } else {
        console.error('Failed to cancel job:', result.error);
      }
    } catch (error) {
      console.error('Error canceling job:', error);
    } finally {
      setCancelingJobs((prev) => {
        const newSet = new Set(prev);
        newSet.delete(jobId);
        return newSet;
      });
    }
  };

  const getProgress = (job: ScrapeJobWithRelations): number => {
    if (!job.tribunals || job.tribunals.length === 0) return 0;
    const total = job.tribunals.length;
    const completed = job.tribunals.filter(
      (t) => t.status === 'completed' || t.status === 'failed'
    ).length;
    return total > 0 ? (completed / total) * 100 : 0;
  };

  const getCurrentTribunal = (job: ScrapeJobWithRelations): string | null => {
    if (!job.tribunals || job.tribunals.length === 0) return null;
    const running = job.tribunals.find((t) => t.status === 'running');
    if (!running?.tribunalConfig?.tribunal) return null;
    return `${running.tribunalConfig.tribunal.codigo}-${running.tribunalConfig.grau}`;
  };

  const getScrapeTypeLabel = (type: string): string => {
    switch (type) {
      case 'acervo_geral':
        return 'Acervo Geral';
      case 'pendentes':
        return 'Pendentes';
      case 'arquivados':
        return 'Arquivados';
      case 'minha_pauta':
        return 'Minha Pauta';
      default:
        return type;
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

  if (isLoading && jobs.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (jobs.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Jobs Ativos</CardTitle>
          <CardDescription>Nenhum job em execução no momento</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {jobs.map((job) => {
        const progress = getProgress(job);
        const currentTribunal = getCurrentTribunal(job);
        const isExpanded = expandedJobs.has(job.id);
        const isCanceling = cancelingJobs.has(job.id);

        return (
          <Card key={job.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <CardTitle className="text-lg">
                    {getScrapeTypeLabel(job.scrapeType)}
                  </CardTitle>
                  <CardDescription>
                    {job.tribunals?.length || 0} {job.tribunals?.length === 1 ? 'tribunal' : 'tribunais'}
                    {currentTribunal && (
                      <span className="ml-2 font-medium text-foreground">
                        • Raspando: {currentTribunal}
                      </span>
                    )}
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  {getStatusBadge(job.status)}
                  {onViewTerminal && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onViewTerminal(job.id)}
                      title="Ver Terminal"
                    >
                      <Terminal className="h-4 w-4" />
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleCancelJob(job.id)}
                    disabled={isCanceling}
                    title="Cancelar Job"
                  >
                    {isCanceling ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <X className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Progress Bar */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Progresso</span>
                  <span className="font-medium">{Math.round(progress)}%</span>
                </div>
                <Progress value={progress} className="h-2" />
              </div>

              {/* Tribunal List */}
              {job.tribunals && job.tribunals.length > 0 && (
                <Collapsible open={isExpanded} onOpenChange={() => toggleExpand(job.id)}>
                  <CollapsibleTrigger asChild>
                    <Button variant="ghost" size="sm" className="w-full justify-between">
                      <span>Ver tribunais ({job.tribunals.length})</span>
                      {isExpanded ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                    </Button>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="mt-2 space-y-2">
                    {job.tribunals.map((tribunal) => (
                    <div
                      key={tribunal.id}
                      className="flex items-center justify-between rounded-md border p-2 text-sm"
                    >
                      <div className="flex items-center gap-2">
                        <Circle
                          className={`h-2 w-2 fill-current ${
                            tribunal.status === 'completed'
                              ? 'text-green-500'
                              : tribunal.status === 'running'
                              ? 'text-blue-500 animate-pulse'
                              : tribunal.status === 'failed'
                              ? 'text-red-500'
                              : 'text-gray-300'
                          }`}
                        />
                        <span>{tribunal.tribunalConfig?.tribunal?.codigo || 'N/A'}</span>
                      </div>
                      {getStatusBadge(tribunal.status)}
                    </div>
                    ))}
                  </CollapsibleContent>
                </Collapsible>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

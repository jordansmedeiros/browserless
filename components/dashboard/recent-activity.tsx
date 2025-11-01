'use client';

/**
 * Recent Activity Component
 * Componente para exibir atividades recentes do sistema
 */

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Activity, CheckCircle, XCircle, Clock, Loader2, FileText } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { RecentActivity } from '@/lib/types/dashboard';

interface RecentActivityProps {
  data?: RecentActivity | null;
  loading?: boolean;
}

/**
 * Skeleton para lista de atividades
 */
function ActivitySkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="flex items-start gap-4">
          <Skeleton className="h-10 w-10 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * Status icon component
 */
function StatusIcon({ status }: { status: string }) {
  switch (status) {
    case 'completed':
      return <CheckCircle className="h-5 w-5 text-green-500" />;
    case 'failed':
      return <XCircle className="h-5 w-5 text-destructive" />;
    case 'running':
      return <Loader2 className="h-5 w-5 text-primary animate-spin" />;
    case 'pending':
      return <Clock className="h-5 w-5 text-yellow-500" />;
    default:
      return <Activity className="h-5 w-5 text-muted-foreground" />;
  }
}

/**
 * Status badge component
 */
function StatusBadge({ status }: { status: string }) {
  const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
    completed: { label: 'Completado', variant: 'default' },
    failed: { label: 'Falhou', variant: 'destructive' },
    running: { label: 'Em Execução', variant: 'secondary' },
    pending: { label: 'Pendente', variant: 'outline' },
  };

  const config = statusConfig[status] || { label: status, variant: 'outline' };

  return <Badge variant={config.variant}>{config.label}</Badge>;
}

/**
 * Componente de atividade individual
 */
function ActivityItem({
  icon,
  title,
  description,
  time,
  status,
}: {
  icon: React.ReactNode;
  title: string;
  description?: string;
  time: string;
  status?: string;
}) {
  return (
    <div className="flex items-start gap-4 py-2 border-b last:border-0">
      <div className="flex-shrink-0 mt-1">{icon}</div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm font-medium">{title}</p>
          {status && <StatusBadge status={status} />}
        </div>
        {description && <p className="text-sm text-muted-foreground mt-1">{description}</p>}
        <p className="text-xs text-muted-foreground mt-1">{time}</p>
      </div>
    </div>
  );
}

/**
 * Recent Executions Section
 */
function RecentExecutions({ execucoes }: { execucoes: RecentActivity['execucoes'] }) {
  if (!execucoes || execucoes.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Nenhuma execução recente
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {execucoes.map((execucao) => (
        <ActivityItem
          key={execucao.id}
          icon={<StatusIcon status={execucao.status} />}
          title={`Raspagem ${execucao.tribunal.nome}`}
          description={`${execucao.processosCount} processos - ${execucao.tribunal.codigo}`}
          time={formatDistanceToNow(execucao.completedAt || execucao.createdAt, {
            addSuffix: true,
            locale: ptBR,
          })}
          status={execucao.status}
        />
      ))}
    </div>
  );
}

/**
 * Recent Jobs Section
 */
function RecentJobs({ jobs }: { jobs: RecentActivity['jobs'] }) {
  if (!jobs || jobs.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">Nenhum job recente</div>
    );
  }

  return (
    <div className="space-y-2">
      {jobs.map((job) => (
        <ActivityItem
          key={job.id}
          icon={<StatusIcon status={job.status} />}
          title={`Job de Raspagem`}
          description={`${job.scrapeType} - ${job.tribunals?.length || 0} tribunais`}
          time={formatDistanceToNow(new Date(job.createdAt), {
            addSuffix: true,
            locale: ptBR,
          })}
          status={job.status}
        />
      ))}
    </div>
  );
}

/**
 * Main Recent Activity Component
 */
export function RecentActivityComponent({ data, loading }: RecentActivityProps) {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Atividade Recente</CardTitle>
          <CardDescription>Últimas atividades do sistema</CardDescription>
        </CardHeader>
        <CardContent>
          <ActivitySkeleton />
        </CardContent>
      </Card>
    );
  }

  if (!data || (!data.jobs && !data.execucoes)) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Atividade Recente</CardTitle>
          <CardDescription>Últimas atividades do sistema</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            Nenhuma atividade disponível
          </div>
        </CardContent>
      </Card>
    );
  }

  const allActivities = [
    ...(data.execucoes || []).map((e) => ({
      ...e,
      type: 'execution' as const,
    })),
    ...(data.jobs || []).map((j) => ({
      ...j,
      type: 'job' as const,
    })),
  ].sort((a, b) => {
    const dateA = 'completedAt' in a && a.completedAt ? a.completedAt : new Date(a.createdAt);
    const dateB = 'completedAt' in b && b.completedAt ? b.completedAt : new Date(b.createdAt);
    return dateB.getTime() - dateA.getTime();
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Atividade Recente</CardTitle>
        <CardDescription>Últimas atividades do sistema</CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px] pr-4">
          {allActivities.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Nenhuma atividade disponível
            </div>
          ) : (
            <div className="space-y-4">
              {allActivities.slice(0, 20).map((activity) => {
                if (activity.type === 'execution') {
                  return (
                    <ActivityItem
                      key={activity.id}
                      icon={<StatusIcon status={activity.status} />}
                      title={`Raspagem ${activity.tribunal.nome}`}
                      description={`${activity.processosCount} processos - ${activity.tribunal.codigo}`}
                      time={formatDistanceToNow(
                        activity.completedAt || new Date(activity.createdAt),
                        {
                          addSuffix: true,
                          locale: ptBR,
                        }
                      )}
                      status={activity.status}
                    />
                  );
                } else {
                  return (
                    <ActivityItem
                      key={activity.id}
                      icon={<StatusIcon status={activity.status} />}
                      title={`Job de Raspagem`}
                      description={`${activity.scrapeType} - ${activity.tribunals?.length || 0} tribunais`}
                      time={formatDistanceToNow(new Date(activity.createdAt), {
                        addSuffix: true,
                        locale: ptBR,
                      })}
                      status={activity.status}
                    />
                  );
                }
              })}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}


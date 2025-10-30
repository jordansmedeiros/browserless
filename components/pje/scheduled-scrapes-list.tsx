'use client';

/**
 * Scheduled Scrapes List Component
 * Lista e gerencia raspagens programadas
 */

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { Clock, Calendar, Play, Pause, Edit, Trash2, Eye, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';
import { listScheduledScrapesAction, toggleScheduledScrapeAction, deleteScheduledScrapeAction } from '@/app/actions/pje';
import { formatCronDescription } from '@/lib/utils/cron-helpers';
import type { ScheduledScrapeWithRelations } from '@/lib/types/scraping';

interface ScheduledScrapesListProps {
  onEdit?: (scheduleId: string) => void;
  onViewJobs?: (scheduleId: string) => void;
}

export function ScheduledScrapesList({ onEdit, onViewJobs }: ScheduledScrapesListProps) {
  const [schedules, setSchedules] = useState<ScheduledScrapeWithRelations[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [scheduleToDelete, setScheduleToDelete] = useState<string | null>(null);

  // Load schedules
  const loadSchedules = async () => {
    setIsLoading(true);
    try {
      const result = await listScheduledScrapesAction({
        active: filter === 'all' ? undefined : filter === 'active',
        page,
        pageSize: 20,
      });

      if (result.success && result.data) {
        setSchedules(result.data.schedules);
        setTotalPages(result.data.totalPages);
      } else {
        toast.error(result.error || 'Erro ao carregar agendamentos');
      }
    } catch (error) {
      console.error('[ScheduledScrapesList] Error loading schedules:', error);
      toast.error('Erro ao carregar agendamentos');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadSchedules();
  }, [filter, page]);

  // Toggle active status
  const handleToggle = async (scheduleId: string, currentActive: boolean) => {
    try {
      const result = await toggleScheduledScrapeAction(scheduleId, !currentActive);

      if (result.success) {
        toast.success(currentActive ? 'Agendamento pausado' : 'Agendamento ativado');
        loadSchedules();
      } else {
        toast.error(result.error || 'Erro ao alterar status');
      }
    } catch (error) {
      console.error('[ScheduledScrapesList] Error toggling schedule:', error);
      toast.error('Erro ao alterar status');
    }
  };

  // Delete schedule
  const handleDelete = async () => {
    if (!scheduleToDelete) return;

    try {
      const result = await deleteScheduledScrapeAction(scheduleToDelete);

      if (result.success) {
        toast.success('Agendamento deletado');
        setDeleteDialogOpen(false);
        setScheduleToDelete(null);
        loadSchedules();
      } else {
        toast.error(result.error || 'Erro ao deletar agendamento');
      }
    } catch (error) {
      console.error('[ScheduledScrapesList] Error deleting schedule:', error);
      toast.error('Erro ao deletar agendamento');
    }
  };

  // Format tribunal badges
  const formatTribunals = (tribunalIds: unknown) => {
    const ids = tribunalIds as string[];
    const visible = ids.slice(0, 3);
    const remaining = ids.length - visible.length;

    return (
      <div className="flex flex-wrap gap-1">
        {visible.map((id) => {
          const code = id.split('-')[0];
          return (
            <Badge key={id} variant="secondary" className="text-xs">
              {code}
            </Badge>
          );
        })}
        {remaining > 0 && (
          <Badge variant="outline" className="text-xs">
            +{remaining} mais
          </Badge>
        )}
      </div>
    );
  };

  // Render loading skeleton
  if (isLoading && schedules.length === 0) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-6 w-1/3" />
              <Skeleton className="h-4 w-1/2 mt-2" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-20 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <Tabs value={filter} onValueChange={(v) => setFilter(v as typeof filter)}>
        <TabsList>
          <TabsTrigger value="all">Todos</TabsTrigger>
          <TabsTrigger value="active">Ativos</TabsTrigger>
          <TabsTrigger value="inactive">Inativos</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Empty state */}
      {schedules.length === 0 && !isLoading && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Clock className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-2">Nenhum agendamento criado</p>
            <p className="text-sm text-muted-foreground">
              {filter === 'all' ? 'Crie seu primeiro agendamento para automatizar raspagens' : `Nenhum agendamento ${filter === 'active' ? 'ativo' : 'inativo'}`}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Schedules list */}
      <div className="grid gap-4 md:grid-cols-2">
        {schedules.map((schedule) => (
          <Card key={schedule.id} className={!schedule.active ? 'opacity-60' : ''}>
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-lg">{schedule.name}</CardTitle>
                    <Badge variant={schedule.active ? 'default' : 'secondary'}>
                      {schedule.active ? 'Ativo' : 'Inativo'}
                    </Badge>
                  </div>
                  {schedule.description && (
                    <CardDescription className="mt-1">{schedule.description}</CardDescription>
                  )}
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-3">
              {/* Credential info */}
              <div className="text-sm">
                <span className="text-muted-foreground">Credencial: </span>
                <span className="font-medium">
                  {schedule.credencial.advogado.nome} (OAB {schedule.credencial.advogado.oabNumero}/{schedule.credencial.advogado.oabUf})
                </span>
              </div>

              {/* Tribunals */}
              <div className="text-sm">
                <span className="text-muted-foreground">Tribunais: </span>
                {formatTribunals(schedule.tribunalConfigIds)}
              </div>

              {/* Scrape type */}
              <div className="text-sm">
                <span className="text-muted-foreground">Tipo: </span>
                <Badge variant="outline" className="text-xs">
                  {schedule.scrapeType}
                  {schedule.scrapeSubType && ` (${schedule.scrapeSubType})`}
                </Badge>
              </div>

              {/* Frequency */}
              <div className="flex items-start gap-2 p-2 bg-muted/50 rounded">
                <Clock className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div className="flex-1 text-sm">
                  <p className="font-medium">{formatCronDescription(schedule.cronExpression)}</p>
                  {schedule.nextRunAt && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Próxima execução: {format(new Date(schedule.nextRunAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                    </p>
                  )}
                </div>
              </div>

              {/* Last run info */}
              {schedule.lastRunAt && (
                <div className="text-xs text-muted-foreground flex items-center gap-2">
                  <Calendar className="h-3 w-3" />
                  <span>
                    Última execução: {format(new Date(schedule.lastRunAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                  </span>
                  {schedule.runCount > 0 && (
                    <Badge variant="outline" className="text-xs">
                      {schedule.runCount} execuções
                    </Badge>
                  )}
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2 pt-2 border-t">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onEdit?.(schedule.id)}
                >
                  <Edit className="h-3 w-3 mr-1" />
                  Editar
                </Button>

                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleToggle(schedule.id, schedule.active)}
                >
                  {schedule.active ? (
                    <>
                      <Pause className="h-3 w-3 mr-1" />
                      Pausar
                    </>
                  ) : (
                    <>
                      <Play className="h-3 w-3 mr-1" />
                      Ativar
                    </>
                  )}
                </Button>

                {schedule.lastJobId && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onViewJobs?.(schedule.id)}
                  >
                    <Eye className="h-3 w-3 mr-1" />
                    Ver Jobs
                  </Button>
                )}

                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => {
                    setScheduleToDelete(schedule.id);
                    setDeleteDialogOpen(true);
                  }}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-4">
          <Button
            variant="outline"
            size="sm"
            disabled={page === 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            Anterior
          </Button>
          <span className="text-sm text-muted-foreground">
            Página {page} de {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page === totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          >
            Próxima
          </Button>
        </div>
      )}

      {/* Delete confirmation dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Tem certeza?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. O agendamento será removido permanentemente.
              <br />
              <br />
              <strong>Nota:</strong> Isso não afetará jobs já criados por este agendamento.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Deletar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

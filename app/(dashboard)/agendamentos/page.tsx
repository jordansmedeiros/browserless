/**
 * PJE Agendamentos Page
 * Página dedicada para gerenciar agendamentos de raspagens
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';
import { Plus, CalendarClock, Loader2 } from 'lucide-react';
import { ScheduledScrapesList } from '@/components/pje/scheduled-scrapes-list';
import { ScheduledScrapeForm } from '@/components/pje/scheduled-scrape-form';
import { listTribunalConfigsAction } from '@/app/actions/pje';
import { useMediaQuery } from '@/hooks/use-media-query';
import type { TribunalConfigConstant } from '@/lib/constants/tribunais';

export default function AgendamentosPage() {
  const router = useRouter();
  const [showScheduleDialog, setShowScheduleDialog] = useState(false);
  const [editingScheduleId, setEditingScheduleId] = useState<string | null>(null);
  const [tribunais, setTribunais] = useState<TribunalConfigConstant[]>([]);
  const [loadingTribunais, setLoadingTribunais] = useState(true);
  const [tribunaisError, setTribunaisError] = useState<string | null>(null);
  const [listVersion, setListVersion] = useState(0);

  const isDesktop = useMediaQuery('(min-width: 768px)');

  // Load tribunais from database on mount
  const loadTribunais = async () => {
    setLoadingTribunais(true);
    setTribunaisError(null);

    try {
      const result = await listTribunalConfigsAction();

      if (result.success && result.data) {
        setTribunais(result.data as TribunalConfigConstant[]);
      } else {
        setTribunaisError(result.error || 'Erro ao carregar tribunais');
      }
    } catch (error) {
      console.error('[AgendamentosPage] Erro ao carregar tribunais:', error);
      setTribunaisError('Erro ao carregar tribunais');
    } finally {
      setLoadingTribunais(false);
    }
  };

  useEffect(() => {
    loadTribunais();
  }, []);

  const handleEdit = (scheduleId: string) => {
    setEditingScheduleId(scheduleId);
    setShowScheduleDialog(true);
  };

  const handleViewJobs = (scheduleId: string) => {
    // Futuro: navegar para /scrapes com filtro por scheduleId
    router.push('/scrapes');
  };

  const handleDialogClose = (open: boolean) => {
    if (!open) {
      setShowScheduleDialog(false);
      setEditingScheduleId(null);
    }
  };

  const handleSuccess = (scheduleId: string) => {
    setShowScheduleDialog(false);
    setEditingScheduleId(null);
    setListVersion((prev) => prev + 1);
  };

  const handleCancel = () => {
    setShowScheduleDialog(false);
    setEditingScheduleId(null);
  };

  // Use Dialog for desktop, Drawer for mobile
  const ScheduleComponent = isDesktop ? Dialog : Drawer;
  const ScheduleTrigger = isDesktop ? DialogContent : DrawerContent;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Agendamentos</h1>
          <p className="text-muted-foreground">
            Gerencie agendamentos de raspagens automatizadas
          </p>
        </div>
        <Button onClick={() => setShowScheduleDialog(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Novo Agendamento
        </Button>
      </div>

      {/* Scheduled Scrapes List */}
      <ScheduledScrapesList
        key={listVersion}
        onEdit={handleEdit}
        onViewJobs={handleViewJobs}
      />

      {/* Scheduled Scrape Dialog */}
      {showScheduleDialog && (
        <ScheduleComponent open={showScheduleDialog} onOpenChange={handleDialogClose}>
          <ScheduleTrigger className={isDesktop ? 'max-w-5xl max-h-[90vh] overflow-hidden flex flex-col' : ''}>
            {isDesktop ? (
              <>
                <DialogHeader className="flex-shrink-0">
                  <DialogTitle className="text-2xl font-bold">
                    {editingScheduleId ? 'Editar Agendamento' : 'Novo Agendamento'}
                  </DialogTitle>
                  <DialogDescription>
                    Configure uma raspagem para ser executada automaticamente
                  </DialogDescription>
                </DialogHeader>
                <div className="flex-1 overflow-y-auto py-4 min-h-0">
                  {loadingTribunais ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                      <span className="ml-3 text-muted-foreground">Carregando tribunais...</span>
                    </div>
                  ) : tribunaisError ? (
                    <div className="text-center py-12">
                      <p className="text-destructive mb-2">{tribunaisError}</p>
                      <Button variant="outline" onClick={loadTribunais}>
                        Tentar novamente
                      </Button>
                    </div>
                  ) : (
                    <ScheduledScrapeForm
                      tribunais={tribunais}
                      scheduleId={editingScheduleId || undefined}
                      onSuccess={handleSuccess}
                      onCancel={handleCancel}
                    />
                  )}
                </div>
              </>
            ) : (
              <>
                <DrawerHeader>
                  <DrawerTitle className="text-2xl font-bold">
                    {editingScheduleId ? 'Editar Agendamento' : 'Novo Agendamento'}
                  </DrawerTitle>
                </DrawerHeader>
                <div className="px-4 overflow-y-auto max-h-[calc(90vh-180px)] min-h-0">
                  {loadingTribunais ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                      <span className="ml-3 text-muted-foreground">Carregando tribunais...</span>
                    </div>
                  ) : tribunaisError ? (
                    <div className="text-center py-12">
                      <p className="text-destructive mb-2">{tribunaisError}</p>
                      <Button variant="outline" onClick={loadTribunais}>
                        Tentar novamente
                      </Button>
                    </div>
                  ) : (
                    <ScheduledScrapeForm
                      tribunais={tribunais}
                      scheduleId={editingScheduleId || undefined}
                      onSuccess={handleSuccess}
                      onCancel={handleCancel}
                    />
                  )}
                </div>
                <DrawerFooter>
                  <DrawerClose asChild>
                    <Button variant="outline">Fechar</Button>
                  </DrawerClose>
                </DrawerFooter>
              </>
            )}
          </ScheduleTrigger>
        </ScheduleComponent>
      )}
    </div>
  );
}


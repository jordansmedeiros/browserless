/**
 * PJE Scrapes Page
 * Main interface for configuring and monitoring scraping jobs
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Plus, Activity, History, X, RefreshCw, Terminal as TerminalIcon, Loader2, CalendarClock } from 'lucide-react';
import { ScrapeConfigForm } from '@/components/pje/scrape-config-form';
import { ScrapeJobMonitor } from '@/components/pje/scrape-job-monitor';
import { ScrapeHistory } from '@/components/pje/scrape-history';
import { ScrapeExecutionDetail } from '@/components/pje/scrape-execution-detail';
import { TerminalMonitor } from '@/components/pje/terminal-monitor';
import { ScheduledScrapeForm } from '@/components/pje/scheduled-scrape-form';
import { ScheduledScrapesList } from '@/components/pje/scheduled-scrapes-list';
import { listTribunalConfigsAction } from '@/app/actions/pje';
import { useMediaQuery } from '@/hooks/use-media-query';
import { useJobsStore } from '@/lib/stores';
import type { TribunalConfigConstant } from '@/lib/constants/tribunais';

export default function ScrapesPage() {
  const router = useRouter();
  const [showConfigDialog, setShowConfigDialog] = useState(false);
  const [showScheduleDialog, setShowScheduleDialog] = useState(false);
  const [editingScheduleId, setEditingScheduleId] = useState<string | null>(null);
  const [selectedExecutionId, setSelectedExecutionId] = useState<string | null>(null);
  const [terminalJobId, setTerminalJobId] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [formHasChanges, setFormHasChanges] = useState(false);
  const [showCloseConfirm, setShowCloseConfirm] = useState(false);
  const [tribunais, setTribunais] = useState<TribunalConfigConstant[]>([]);
  const [loadingTribunais, setLoadingTribunais] = useState(true);
  const [tribunaisError, setTribunaisError] = useState<string | null>(null);

  const isDesktop = useMediaQuery('(min-width: 768px)');
  const jobsStore = useJobsStore();

  // Load tribunais from database on mount
  useEffect(() => {
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
        console.error('[ScrapesPage] Erro ao carregar tribunais:', error);
        setTribunaisError('Erro ao carregar tribunais');
      } finally {
        setLoadingTribunais(false);
      }
    };

    loadTribunais();
  }, []);

  // Compute isRunning dynamically from the jobs store
  // A job is running if it exists in activeJobs (which only contains pending/running jobs)
  const isJobRunning = terminalJobId ? !!jobsStore.getJobById(terminalJobId) : false;

  const handleJobCreated = (jobId: string) => {
    setFormHasChanges(false);
    setShowConfigDialog(false);
    // Watch the newly created job for monitoring
    jobsStore.watchJob(jobId);
    // Open terminal monitor for the new job
    setTerminalJobId(jobId);
  };

  const handleViewTerminal = (jobId: string) => {
    setTerminalJobId(jobId);
  };

  const handleDialogClose = (open: boolean) => {
    if (!open && formHasChanges) {
      // User is trying to close with unsaved changes - show confirmation
      setShowCloseConfirm(true);
      return; // Don't close yet
    }
    setFormHasChanges(false);
    setShowConfigDialog(open);
  };

  const handleConfirmClose = () => {
    setFormHasChanges(false);
    setShowConfigDialog(false);
    setShowCloseConfirm(false);
  };

  const handleViewDetails = (jobId: string) => {
    router.push(`/pje/scrapes/${jobId}`);
  };

  const handleViewExecution = (executionId: string) => {
    setSelectedExecutionId(executionId);
  };

  // Use Dialog for desktop, Drawer for mobile
  const ConfigComponent = isDesktop ? Dialog : Drawer;
  const ConfigTrigger = isDesktop ? DialogContent : DrawerContent;

  return (
    <div className="space-y-6">
      {/* Main Content Tabs */}
      <Tabs defaultValue="active" className="space-y-4">
        {/* Header: Tabs + Controls */}
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="active" className="gap-2">
              <Activity className="h-4 w-4" />
              Jobs Ativos
            </TabsTrigger>
            <TabsTrigger value="history" className="gap-2">
              <History className="h-4 w-4" />
              Histórico
            </TabsTrigger>
            <TabsTrigger value="schedules" className="gap-2">
              <CalendarClock className="h-4 w-4" />
              Agendamentos
            </TabsTrigger>
          </TabsList>

          <div className="flex items-center gap-4">
            {/* Auto-refresh toggle */}
            <div className="flex items-center gap-2">
              <Switch
                id="auto-refresh"
                checked={autoRefresh}
                onCheckedChange={setAutoRefresh}
              />
              <Label htmlFor="auto-refresh" className="cursor-pointer flex items-center gap-1.5">
                <RefreshCw className={`h-4 w-4 ${autoRefresh ? 'text-primary' : 'text-muted-foreground'}`} />
                <span className="text-sm">Auto-atualizar</span>
              </Label>
            </div>
            <Button onClick={() => setShowConfigDialog(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Nova Raspagem
            </Button>
          </div>
        </div>

        <TabsContent value="active" className="space-y-4">
          <ScrapeJobMonitor
            autoRefresh={autoRefresh}
            onViewTerminal={handleViewTerminal}
          />
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <ScrapeHistory
            onViewDetails={handleViewDetails}
          />
        </TabsContent>

        <TabsContent value="schedules" className="space-y-4">
          <div className="flex justify-end mb-4">
            <Button onClick={() => setShowScheduleDialog(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Novo Agendamento
            </Button>
          </div>
          <ScheduledScrapesList
            onEdit={(scheduleId) => {
              setEditingScheduleId(scheduleId);
              setShowScheduleDialog(true);
            }}
            onViewJobs={(scheduleId) => {
              // Futuro: filtrar histórico por scheduleId
            }}
          />
        </TabsContent>
      </Tabs>

      {/* New Scrape Job Dialog/Drawer */}
      <ConfigComponent open={showConfigDialog} onOpenChange={handleDialogClose}>
        <ConfigTrigger className={isDesktop ? 'max-w-5xl max-h-[90vh] overflow-hidden flex flex-col' : ''}>
          {isDesktop ? (
            <>
              <DialogHeader className="flex-shrink-0">
                <DialogTitle className="text-2xl font-bold">Nova Raspagem</DialogTitle>
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
                    <Button variant="outline" onClick={() => window.location.reload()}>
                      Tentar novamente
                    </Button>
                  </div>
                ) : (
                  <ScrapeConfigForm
                    tribunais={tribunais}
                    onJobCreated={handleJobCreated}
                    onReset={() => {
                      setFormHasChanges(false);
                      setShowConfigDialog(false);
                    }}
                    onFormChange={() => setFormHasChanges(true)}
                  />
                )}
              </div>
            </>
          ) : (
            <>
              <DrawerHeader>
                <DrawerTitle className="text-2xl font-bold">Nova Raspagem</DrawerTitle>
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
                    <Button variant="outline" onClick={() => window.location.reload()}>
                      Tentar novamente
                    </Button>
                  </div>
                ) : (
                  <ScrapeConfigForm
                    tribunais={tribunais}
                    onJobCreated={handleJobCreated}
                    onReset={() => {
                      setFormHasChanges(false);
                      setShowConfigDialog(false);
                    }}
                    onFormChange={() => setFormHasChanges(true)}
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
        </ConfigTrigger>
      </ConfigComponent>

      {/* Execution Detail Dialog */}
      {selectedExecutionId && (
        <Dialog open={!!selectedExecutionId} onOpenChange={() => setSelectedExecutionId(null)}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <div className="flex items-center justify-between">
                <DialogTitle>Detalhes da Execução</DialogTitle>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setSelectedExecutionId(null)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </DialogHeader>
            <ScrapeExecutionDetail executionId={selectedExecutionId} />
          </DialogContent>
        </Dialog>
      )}

      {/* Terminal Monitor Dialog */}
      {terminalJobId && (
        <Dialog open={!!terminalJobId} onOpenChange={() => setTerminalJobId(null)}>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <TerminalIcon className="h-5 w-5" />
                  <DialogTitle>Monitor de Raspagem</DialogTitle>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setTerminalJobId(null)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <DialogDescription>
                Acompanhe o progresso da raspagem em tempo real
              </DialogDescription>
            </DialogHeader>
            <TerminalMonitor jobId={terminalJobId} isRunning={isJobRunning} />
          </DialogContent>
        </Dialog>
      )}

      {/* Scheduled Scrape Dialog */}
      {showScheduleDialog && (
        <Dialog open={showScheduleDialog} onOpenChange={(open) => {
          if (!open) {
            setShowScheduleDialog(false);
            setEditingScheduleId(null);
          }
        }}>
          <DialogContent className={isDesktop ? 'max-w-5xl max-h-[90vh] overflow-hidden flex flex-col' : ''}>
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
                      <Button variant="outline" onClick={() => window.location.reload()}>
                        Tentar novamente
                      </Button>
                    </div>
                  ) : (
                    <ScheduledScrapeForm
                      tribunais={tribunais}
                      scheduleId={editingScheduleId || undefined}
                      onSuccess={(scheduleId) => {
                        setShowScheduleDialog(false);
                        setEditingScheduleId(null);
                      }}
                      onCancel={() => {
                        setShowScheduleDialog(false);
                        setEditingScheduleId(null);
                      }}
                    />
                  )}
                </div>
              </>
            ) : (
              <ScheduledScrapeForm
                tribunais={tribunais}
                scheduleId={editingScheduleId || undefined}
                onSuccess={(scheduleId) => {
                  setShowScheduleDialog(false);
                  setEditingScheduleId(null);
                }}
                onCancel={() => {
                  setShowScheduleDialog(false);
                  setEditingScheduleId(null);
                }}
              />
            )}
          </DialogContent>
        </Dialog>
      )}

      {/* Close Confirmation Dialog */}
      <AlertDialog open={showCloseConfirm} onOpenChange={setShowCloseConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Descartar alterações?</AlertDialogTitle>
            <AlertDialogDescription>
              Você tem seleções não salvas. Tem certeza que deseja fechar? As alterações serão perdidas.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmClose}>
              Descartar e Fechar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

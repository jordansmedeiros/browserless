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
import { Plus, Activity, History, Eye, X, RefreshCw, Terminal as TerminalIcon } from 'lucide-react';
import { ScrapeConfigForm } from '@/components/pje/scrape-config-form';
import { ScrapeJobMonitor } from '@/components/pje/scrape-job-monitor';
import { ScrapeHistory } from '@/components/pje/scrape-history';
import { ScrapeExecutionDetail } from '@/components/pje/scrape-execution-detail';
import { TerminalMonitor } from '@/components/pje/terminal-monitor';
import { TRIBUNAL_CONFIGS } from '@/lib/constants/tribunais';
import { useMediaQuery } from '@/hooks/use-media-query';
import { listAdvogadosAction } from '@/app/actions/pje';
import type { CredencialWithRelations } from '@/lib/types';

export default function ScrapesPage() {
  const router = useRouter();
  const [showConfigDialog, setShowConfigDialog] = useState(false);
  const [selectedExecutionId, setSelectedExecutionId] = useState<string | null>(null);
  const [terminalJobId, setTerminalJobId] = useState<string | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [newJobIds, setNewJobIds] = useState<string[]>([]);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [formHasChanges, setFormHasChanges] = useState(false);
  const [showCloseConfirm, setShowCloseConfirm] = useState(false);
  const [credentials, setCredentials] = useState<CredencialWithRelations[]>([]);
  const [loadingCredentials, setLoadingCredentials] = useState(false);

  const isDesktop = useMediaQuery('(min-width: 768px)');

  // Load credentials on mount
  useEffect(() => {
    loadCredentials();
  }, []);

  async function loadCredentials() {
    setLoadingCredentials(true);
    try {
      // Get all advogados with their credentials (including tribunais relationship)
      const result = await listAdvogadosAction();
      if (result.success && result.data) {
        console.log('[loadCredentials] Advogados carregados:', result.data.length);

        // Extract all active credentials from all advogados
        const allCredentials: CredencialWithRelations[] = [];
        result.data.forEach((advogado) => {
          console.log('[loadCredentials] Advogado:', advogado.nome,
            'escritório:', advogado.escritorio?.nome || 'Sem escritório',
            'com', advogado.credenciais.length, 'credenciais');

          advogado.credenciais.forEach((credencial) => {
            if (credencial.ativa) {
              const tribunaisCount = credencial.tribunais?.length || 0;
              console.log('[loadCredentials] Credencial:', credencial.id,
                'descrição:', credencial.descricao || 'sem descrição',
                'tribunais:', tribunaisCount);

              // Credentials from listAdvogadosAction already include tribunais with full relations
              allCredentials.push({
                ...credencial,
                advogado: {
                  ...advogado,
                  credenciais: [], // Avoid circular reference
                },
              } as CredencialWithRelations);
            }
          });
        });

        console.log('[loadCredentials] Total de credenciais ativas:', allCredentials.length);
        console.log('[loadCredentials] Tribunais por credencial:',
          allCredentials.map(c => ({ id: c.id.slice(0, 8), tribunais: c.tribunais?.length || 0 })));
        setCredentials(allCredentials);
      }
    } catch (error) {
      console.error('Error loading credentials:', error);
    } finally {
      setLoadingCredentials(false);
    }
  }

  const handleJobCreated = (jobId: string) => {
    setFormHasChanges(false);
    setShowConfigDialog(false);
    setNewJobIds((prev) => [...prev, jobId]);
    setRefreshTrigger((prev) => prev + 1);
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
            initialJobIds={newJobIds}
            autoRefresh={autoRefresh}
            onJobsUpdate={(jobs) => {
              // Update new job IDs based on active jobs
              const activeIds = jobs.map((j) => j.id);
              setNewJobIds((prev) => prev.filter((id) => activeIds.includes(id)));
            }}
            onViewTerminal={handleViewTerminal}
          />
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <ScrapeHistory
            onViewDetails={handleViewDetails}
            refreshTrigger={refreshTrigger}
          />
        </TabsContent>
      </Tabs>

      {/* New Scrape Job Dialog/Drawer */}
      <ConfigComponent open={showConfigDialog} onOpenChange={handleDialogClose}>
        <ConfigTrigger className={isDesktop ? 'max-w-5xl max-h-[85vh] overflow-hidden flex flex-col' : ''}>
          {isDesktop ? (
            <>
              <DialogHeader className="flex-shrink-0">
                <DialogTitle className="text-2xl font-bold">Nova Raspagem</DialogTitle>
              </DialogHeader>
              <div className="flex-1 overflow-y-auto py-4">
                <ScrapeConfigForm
                  credentials={credentials}
                  tribunais={TRIBUNAL_CONFIGS}
                  onJobCreated={handleJobCreated}
                  onReset={() => {
                    setFormHasChanges(false);
                    setShowConfigDialog(false);
                  }}
                  onFormChange={() => setFormHasChanges(true)}
                />
              </div>
            </>
          ) : (
            <>
              <DrawerHeader>
                <DrawerTitle className="text-2xl font-bold">Nova Raspagem</DrawerTitle>
              </DrawerHeader>
              <div className="px-4 overflow-y-auto max-h-[calc(90vh-200px)]">
                <ScrapeConfigForm
                  credentials={credentials}
                  tribunais={TRIBUNAL_CONFIGS}
                  onJobCreated={handleJobCreated}
                  onReset={() => {
                    setFormHasChanges(false);
                    setShowConfigDialog(false);
                  }}
                  onFormChange={() => setFormHasChanges(true)}
                />
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
            <TerminalMonitor jobId={terminalJobId} isRunning={true} />
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

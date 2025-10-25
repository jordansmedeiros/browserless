/**
 * PJE Scrapes Page
 * Main interface for configuring and monitoring scraping jobs
 */

'use client';

import { useState, useEffect } from 'react';
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
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Activity, History, Eye, X } from 'lucide-react';
import { ScrapeConfigForm } from '@/components/pje/scrape-config-form';
import { ScrapeJobMonitor } from '@/components/pje/scrape-job-monitor';
import { ScrapeHistory } from '@/components/pje/scrape-history';
import { ScrapeExecutionDetail } from '@/components/pje/scrape-execution-detail';
import { TRIBUNAL_CONFIGS } from '@/lib/constants/tribunais';
import { useMediaQuery } from '@/hooks/use-media-query';

export default function ScrapesPage() {
  const [showConfigDialog, setShowConfigDialog] = useState(false);
  const [selectedExecutionId, setSelectedExecutionId] = useState<string | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [newJobIds, setNewJobIds] = useState<string[]>([]);

  const isDesktop = useMediaQuery('(min-width: 768px)');

  const handleJobCreated = (jobId: string) => {
    setShowConfigDialog(false);
    setNewJobIds((prev) => [...prev, jobId]);
    setRefreshTrigger((prev) => prev + 1);
  };

  const handleViewDetails = (jobId: string) => {
    // For now, we'll show execution details when user clicks on a job
    // In a full implementation, this would navigate to a dedicated page
    // or open a modal with job details
    console.log('View job details:', jobId);
  };

  const handleViewExecution = (executionId: string) => {
    setSelectedExecutionId(executionId);
  };

  // Use Dialog for desktop, Drawer for mobile
  const ConfigComponent = isDesktop ? Dialog : Drawer;
  const ConfigTrigger = isDesktop ? DialogContent : DrawerContent;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Raspagens PJE</h1>
          <p className="text-muted-foreground">
            Configure e monitore raspagens de processos judiciais
          </p>
        </div>
        <Button onClick={() => setShowConfigDialog(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Nova Raspagem
        </Button>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="active" className="space-y-4">
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

        <TabsContent value="active" className="space-y-4">
          <ScrapeJobMonitor
            initialJobIds={newJobIds}
            onJobsUpdate={(jobs) => {
              // Update new job IDs based on active jobs
              const activeIds = jobs.map((j) => j.id);
              setNewJobIds((prev) => prev.filter((id) => activeIds.includes(id)));
            }}
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
      <ConfigComponent open={showConfigDialog} onOpenChange={setShowConfigDialog}>
        <ConfigTrigger className={isDesktop ? 'max-w-4xl max-h-[90vh] overflow-y-auto' : ''}>
          {isDesktop ? (
            <>
              <DialogHeader>
                <DialogTitle>Configurar Nova Raspagem</DialogTitle>
                <DialogDescription>
                  Selecione tribunais e tipo de raspagem para iniciar
                </DialogDescription>
              </DialogHeader>
              <div className="py-4">
                <ScrapeConfigForm
                  tribunais={TRIBUNAL_CONFIGS}
                  onJobCreated={handleJobCreated}
                  onReset={() => setShowConfigDialog(false)}
                />
              </div>
            </>
          ) : (
            <>
              <DrawerHeader>
                <DrawerTitle>Configurar Nova Raspagem</DrawerTitle>
                <DrawerDescription>
                  Selecione tribunais e tipo de raspagem para iniciar
                </DrawerDescription>
              </DrawerHeader>
              <div className="px-4 overflow-y-auto max-h-[calc(90vh-200px)]">
                <ScrapeConfigForm
                  tribunais={TRIBUNAL_CONFIGS}
                  onJobCreated={handleJobCreated}
                  onReset={() => setShowConfigDialog(false)}
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
    </div>
  );
}

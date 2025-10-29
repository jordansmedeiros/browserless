/**
 * Scrape Results Tabs Component
 * Container for different result views (Table, JSON, Explorer)
 */

'use client';

import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table2, Code2, FolderTree } from 'lucide-react';
import { ResultsTableView } from './results-table-view';
import { ResultsJSONView } from './results-json-view';
import { ResultsExplorerView } from './results-explorer-view';
import type { ScrapeJobWithRelations } from '@/lib/types/scraping';

interface ScrapeResultsTabsProps {
  job: ScrapeJobWithRelations;
  allProcesses: any[];
}

export function ScrapeResultsTabs({ job, allProcesses }: ScrapeResultsTabsProps) {
  const [activeTab, setActiveTab] = useState('table');

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="table" className="gap-2">
          <Table2 className="h-4 w-4" />
          Tabela
        </TabsTrigger>
        <TabsTrigger value="json" className="gap-2">
          <Code2 className="h-4 w-4" />
          JSON
        </TabsTrigger>
        <TabsTrigger value="explorer" className="gap-2">
          <FolderTree className="h-4 w-4" />
          Explorador
        </TabsTrigger>
      </TabsList>

      <TabsContent value="table" className="space-y-4">
        <ResultsTableView job={job} allProcesses={allProcesses} />
      </TabsContent>

      <TabsContent value="json" className="space-y-4">
        <ResultsJSONView job={job} allProcesses={allProcesses} />
      </TabsContent>

      <TabsContent value="explorer" className="space-y-4">
        <ResultsExplorerView job={job} allProcesses={allProcesses} />
      </TabsContent>
    </Tabs>
  );
}

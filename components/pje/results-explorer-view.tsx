/**
 * Results Explorer View Component
 * Displays scraped processes in a hierarchical file explorer structure
 */

'use client';

import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  ChevronRight,
  ChevronDown,
  Folder,
  FolderOpen,
  FileText,
  Search,
  X,
} from 'lucide-react';
import type { ScrapeJobWithRelations } from '@/lib/types/scraping';

interface ResultsExplorerViewProps {
  job: ScrapeJobWithRelations;
  allProcesses: any[];
}

interface ProcessNode {
  numeroProcesso: string;
  data: any;
}

interface TribunalNode {
  tribunal: string;
  executionId: string;
  processCount: number;
  processes: ProcessNode[];
  expanded: boolean;
}

export function ResultsExplorerView({ job, allProcesses }: ResultsExplorerViewProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());

  // Build simplified tree structure (all processes grouped together)
  const tribunalTree = useMemo(() => {
    if (allProcesses.length === 0) return [];

    // Group all processes under a single node
    const nodes: TribunalNode[] = [{
      tribunal: 'Todos os Processos',
      executionId: 'all',
      processCount: allProcesses.length,
      processes: allProcesses.map((p: any) => ({
        numeroProcesso: p.numeroProcesso || p.nrProcesso || 'Sem número',
        data: p,
      })),
      expanded: false,
    }];

    return nodes;
  }, [allProcesses]);


  // Filter by search term
  const filteredTree = useMemo(() => {
    if (!searchTerm.trim()) return tribunalTree;

    const term = searchTerm.toLowerCase();
    return tribunalTree
      .map((node) => ({
        ...node,
        processes: node.processes.filter((process) => {
          const jsonStr = JSON.stringify(process.data).toLowerCase();
          return jsonStr.includes(term) || process.numeroProcesso.toLowerCase().includes(term);
        }),
      }))
      .filter((node) => node.processes.length > 0);
  }, [tribunalTree, searchTerm]);

  // Count totals
  const totalTribunals = filteredTree.length;
  const totalProcesses = filteredTree.reduce((sum, node) => sum + node.processes.length, 0);

  // Toggle tribunal node
  const toggleNode = (executionId: string) => {
    const newExpanded = new Set(expandedNodes);
    if (newExpanded.has(executionId)) {
      newExpanded.delete(executionId);
    } else {
      newExpanded.add(executionId);
    }
    setExpandedNodes(newExpanded);
  };

  // Toggle process details
  const toggleProcess = (processId: string) => {
    const newExpanded = new Set(expandedNodes);
    if (newExpanded.has(processId)) {
      newExpanded.delete(processId);
    } else {
      newExpanded.add(processId);
    }
    setExpandedNodes(newExpanded);
  };

  // Expand/collapse all
  const expandAll = () => {
    const allIds = new Set<string>();
    filteredTree.forEach((node) => {
      allIds.add(node.executionId);
      node.processes.forEach((process, idx) => {
        allIds.add(`${node.executionId}-${idx}`);
      });
    });
    setExpandedNodes(allIds);
  };

  const collapseAll = () => {
    setExpandedNodes(new Set());
  };

  if (tribunalTree.length === 0) {
    return (
      <Card className="p-8 text-center">
        <p className="text-muted-foreground">Nenhum processo encontrado neste job.</p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex-1 flex items-center gap-2">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar processos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-9"
            />
            {searchTerm && (
              <Button
                variant="ghost"
                size="sm"
                className="absolute right-1 top-1/2 transform -translate-y-1/2 h-7 w-7 p-0"
                onClick={() => setSearchTerm('')}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
          <Badge variant="secondary">
            {totalProcesses} processo{totalProcesses !== 1 ? 's' : ''} em {totalTribunals} tribunal
            {totalTribunals !== 1 ? 'is' : ''}
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={expandAll}>
            Expandir Tudo
          </Button>
          <Button variant="outline" size="sm" onClick={collapseAll}>
            Colapsar Tudo
          </Button>
        </div>
      </div>

      {/* Explorer Tree */}
      <Card className="p-4">
        <div className="space-y-2">
          {filteredTree.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Nenhum resultado encontrado.
            </div>
          ) : (
            filteredTree.map((node) => {
              const isExpanded = expandedNodes.has(node.executionId);

              return (
                <div key={node.executionId} className="border rounded-lg">
                  {/* Tribunal Header */}
                  <button
                    onClick={() => toggleNode(node.executionId)}
                    className="w-full flex items-center gap-2 p-3 hover:bg-accent transition-colors"
                  >
                    {isExpanded ? (
                      <ChevronDown className="h-4 w-4 shrink-0" />
                    ) : (
                      <ChevronRight className="h-4 w-4 shrink-0" />
                    )}
                    {isExpanded ? (
                      <FolderOpen className="h-4 w-4 shrink-0 text-primary" />
                    ) : (
                      <Folder className="h-4 w-4 shrink-0 text-primary" />
                    )}
                    <span className="font-medium flex-1 text-left">{node.tribunal}</span>
                    <Badge variant="secondary">{node.processes.length} processos</Badge>
                  </button>

                  {/* Processes List */}
                  {isExpanded && (
                    <div className="border-t bg-muted/30">
                      {node.processes.map((process, idx) => {
                        const processId = `${node.executionId}-${idx}`;
                        const isProcessExpanded = expandedNodes.has(processId);

                        return (
                          <div key={processId} className="border-b last:border-b-0">
                            {/* Process Header */}
                            <button
                              onClick={() => toggleProcess(processId)}
                              className="w-full flex items-center gap-2 p-3 pl-12 hover:bg-accent transition-colors text-sm"
                            >
                              {isProcessExpanded ? (
                                <ChevronDown className="h-3 w-3 shrink-0" />
                              ) : (
                                <ChevronRight className="h-3 w-3 shrink-0" />
                              )}
                              <FileText className="h-3 w-3 shrink-0 text-blue-500" />
                              <span className="flex-1 text-left font-mono">
                                {process.numeroProcesso}
                              </span>
                            </button>

                            {/* Process Details */}
                            {isProcessExpanded && (
                              <div className="p-4 pl-16 bg-background">
                                <pre className="text-xs font-mono overflow-x-auto p-3 bg-muted rounded">
                                  {JSON.stringify(process.data, null, 2)}
                                </pre>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </Card>
    </div>
  );
}

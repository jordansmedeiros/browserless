/**
 * Results JSON View Component
 * Displays scraped processes as formatted JSON with search and copy
 */

'use client';

import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Copy, Check, Search, X, ChevronDown, ChevronRight } from 'lucide-react';
import type { ScrapeJobWithRelations } from '@/lib/types/scraping';
import { useCopyToClipboard } from '@/hooks/use-copy-to-clipboard';

interface ResultsJSONViewProps {
  job: ScrapeJobWithRelations;
  allProcesses: any[];
}

export function ResultsJSONView({ job, allProcesses }: ResultsJSONViewProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [copy, isCopied] = useCopyToClipboard();
  const [expandedPaths, setExpandedPaths] = useState<Set<string>>(new Set());

  // Create full data object
  const jsonData = useMemo(() => ({
    jobId: job.id,
    status: job.status,
    scrapeType: job.scrapeType,
    createdAt: job.createdAt,
    completedAt: job.completedAt,
    totalProcesses: allProcesses.length,
    processes: allProcesses,
  }), [job, allProcesses]);

  // Format JSON
  const formattedJSON = useMemo(() => {
    return JSON.stringify(jsonData, null, 2);
  }, [jsonData]);

  // Highlight search terms
  const highlightedJSON = useMemo(() => {
    if (!searchTerm.trim()) return formattedJSON;

    // Escape special regex characters in search term
    const escapedTerm = searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(${escapedTerm})`, 'gi');
    return formattedJSON.replace(regex, '<mark class="bg-highlight text-highlight-foreground">$1</mark>');
  }, [formattedJSON, searchTerm]);

  // Handle copy
  const handleCopy = () => {
    copy(formattedJSON);
  };

  // Handle download
  const handleDownload = () => {
    const blob = new Blob([formattedJSON], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `scrape-${job.id.slice(0, 8)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (allProcesses.length === 0) {
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
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-foreground/70" />
            <Input
              placeholder="Buscar no JSON..."
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
            {allProcesses.length} processo{allProcesses.length !== 1 ? 's' : ''}
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleCopy}>
            {isCopied ? (
              <>
                <Check className="mr-2 h-4 w-4" />
                Copiado!
              </>
            ) : (
              <>
                <Copy className="mr-2 h-4 w-4" />
                Copiar JSON
              </>
            )}
          </Button>
          <Button variant="outline" size="sm" onClick={handleDownload}>
            Baixar JSON
          </Button>
        </div>
      </div>

      {/* JSON Display */}
      <Card className="bg-card border-border">
        <div className="max-h-[600px] overflow-auto">
          <pre className="text-sm font-mono text-foreground bg-muted p-4 rounded-md">
            <code dangerouslySetInnerHTML={{ __html: highlightedJSON }} />
          </pre>
        </div>
      </Card>

      {/* Stats */}
      <div className="flex items-center justify-between text-sm text-muted-foreground font-medium">
        <div>
          Tamanho: {(new Blob([formattedJSON]).size / 1024).toFixed(2)} KB
        </div>
        <div>
          Linhas: {formattedJSON.split('\n').length.toLocaleString('pt-BR')}
        </div>
      </div>
    </div>
  );
}

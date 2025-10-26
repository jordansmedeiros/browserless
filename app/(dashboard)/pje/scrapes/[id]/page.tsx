/**
 * PJE Scrape Job Detail Page
 * Displays detailed results of a scraping job with multiple views
 */

'use client';

import { useEffect, useState, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ArrowLeft, AlertCircle } from 'lucide-react';
import { getScrapeJobAction } from '@/app/actions/pje';
import { ScrapeJobHeader } from '@/components/pje/scrape-job-header';
import { ScrapeResultsTabs } from '@/components/pje/scrape-results-tabs';
import type { ScrapeJobWithRelations } from '@/lib/types/scraping';
import { decompressJSON } from '@/lib/utils/compression';
import { toast } from 'sonner';

export default function ScrapeJobDetailPage() {
  const params = useParams();
  const router = useRouter();
  const jobId = params.id as string;

  const [job, setJob] = useState<ScrapeJobWithRelations | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Extract all process data from job executions
  const allProcesses = useMemo(() => {
    if (!job?.executions) return [];

    const processes: any[] = [];
    job.executions.forEach((execution) => {
      if (execution.resultData) {
        try {
          const decompressed = decompressJSON(execution.resultData);
          if (decompressed?.processos && Array.isArray(decompressed.processos)) {
            processes.push(...decompressed.processos);
          }
        } catch (error) {
          console.error('[ScrapeJobDetailPage] Error decompressing data:', error);
        }
      }
    });

    return processes;
  }, [job]);

  useEffect(() => {
    const fetchJob = async () => {
      try {
        setIsLoading(true);
        const result = await getScrapeJobAction(jobId);

        if (result.success && result.data) {
          setJob(result.data);
        } else {
          setError(result.error || 'Job não encontrado');
        }
      } catch (err) {
        setError('Erro ao carregar job');
        console.error('[ScrapeJobDetailPage] Error:', err);
      } finally {
        setIsLoading(false);
      }
    };

    if (jobId) {
      fetchJob();
    }
  }, [jobId]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-12 w-64" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (error || !job) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar
        </Button>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error || 'Job não encontrado'}</AlertDescription>
        </Alert>
      </div>
    );
  }

  // Export handlers
  const handleExportCSV = () => {
    if (allProcesses.length === 0) {
      toast.error('Nenhum dado disponível para exportar');
      return;
    }

    try {
      // Get all unique keys from all processes
      const allKeys = new Set<string>();
      allProcesses.forEach((process) => {
        Object.keys(process).forEach((key) => allKeys.add(key));
      });
      const headers = Array.from(allKeys);

      // Create CSV header
      const csvLines: string[] = [];
      csvLines.push(headers.map((h) => `"${h}"`).join(','));

      // Create CSV rows
      allProcesses.forEach((process) => {
        const row = headers.map((header) => {
          const value = process[header];
          if (value === null || value === undefined) return '""';
          // Escape quotes and wrap in quotes
          const stringValue = String(value).replace(/"/g, '""');
          return `"${stringValue}"`;
        });
        csvLines.push(row.join(','));
      });

      // Create and download blob
      const csvContent = csvLines.join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `scrape-job-${jobId.slice(0, 8)}-results.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success(`Exportados ${allProcesses.length} processos para CSV`);
    } catch (error) {
      console.error('[Export CSV] Error:', error);
      toast.error('Erro ao exportar CSV');
    }
  };

  const handleExportJSON = () => {
    if (allProcesses.length === 0) {
      toast.error('Nenhum dado disponível para exportar');
      return;
    }

    try {
      const jsonData = {
        jobId: job?.id,
        scrapeType: job?.scrapeType,
        createdAt: job?.createdAt,
        completedAt: job?.completedAt,
        totalProcesses: allProcesses.length,
        processes: allProcesses,
      };

      const jsonString = JSON.stringify(jsonData, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `scrape-job-${jobId.slice(0, 8)}-results.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success(`Exportados ${allProcesses.length} processos para JSON`);
    } catch (error) {
      console.error('[Export JSON] Error:', error);
      toast.error('Erro ao exportar JSON');
    }
  };

  const handleExportExcel = () => {
    if (allProcesses.length === 0) {
      toast.error('Nenhum dado disponível para exportar');
      return;
    }

    try {
      // For Excel export, we'll use a simple approach:
      // Create an HTML table and let the browser save it as Excel
      // This works without additional dependencies

      // Get all unique keys
      const allKeys = new Set<string>();
      allProcesses.forEach((process) => {
        Object.keys(process).forEach((key) => allKeys.add(key));
      });
      const headers = Array.from(allKeys);

      // Create HTML table
      let html = '<table>';

      // Header row
      html += '<tr>';
      headers.forEach((header) => {
        html += `<th>${header}</th>`;
      });
      html += '</tr>';

      // Data rows
      allProcesses.forEach((process) => {
        html += '<tr>';
        headers.forEach((header) => {
          const value = process[header];
          const cellValue = value === null || value === undefined ? '' : String(value);
          html += `<td>${cellValue}</td>`;
        });
        html += '</tr>';
      });

      html += '</table>';

      // Create blob with Excel MIME type
      const blob = new Blob([html], { type: 'application/vnd.ms-excel' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `scrape-job-${jobId.slice(0, 8)}-results.xls`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success(`Exportados ${allProcesses.length} processos para Excel`);
    } catch (error) {
      console.error('[Export Excel] Error:', error);
      toast.error('Erro ao exportar Excel');
    }
  };

  const handleRetryFailed = () => {
    toast.info('Funcionalidade de retry será implementada em breve');
    // TODO: Implement retry logic in future iteration
  };

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <Button variant="ghost" onClick={() => router.back()}>
        <ArrowLeft className="mr-2 h-4 w-4" />
        Voltar
      </Button>

      {/* Job Metadata Header */}
      <ScrapeJobHeader
        job={job}
        onExportCSV={handleExportCSV}
        onExportJSON={handleExportJSON}
        onExportExcel={handleExportExcel}
        onRetryFailed={handleRetryFailed}
      />

      {/* Results Tabs */}
      <ScrapeResultsTabs job={job} />
    </div>
  );
}

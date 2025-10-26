/**
 * PJE Scrape Job Detail Page
 * Displays detailed results of a scraping job with multiple views
 */

'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ArrowLeft, AlertCircle } from 'lucide-react';
import { getScrapeJobAction } from '@/app/actions/pje';
import { ScrapeJobHeader } from '@/components/pje/scrape-job-header';
import { ScrapeResultsTabs } from '@/components/pje/scrape-results-tabs';
import type { ScrapeJobWithRelations } from '@/lib/types/scraping';

export default function ScrapeJobDetailPage() {
  const params = useParams();
  const router = useRouter();
  const jobId = params.id as string;

  const [job, setJob] = useState<ScrapeJobWithRelations | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  // Export handlers (to be implemented)
  const handleExportCSV = () => {
    console.log('Export CSV');
    // TODO: Implement CSV export
  };

  const handleExportJSON = () => {
    console.log('Export JSON');
    // TODO: Implement JSON export
  };

  const handleExportExcel = () => {
    console.log('Export Excel');
    // TODO: Implement Excel export
  };

  const handleRetryFailed = () => {
    console.log('Retry failed tribunals');
    // TODO: Implement retry logic
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

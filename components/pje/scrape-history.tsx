/**
 * Scrape History Component
 * Table displaying scraping job history with filters
 */

'use client';

import { useState, useEffect } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Loader2, Search, CalendarIcon, Eye, ChevronLeft, ChevronRight } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { listScrapeJobsAction } from '@/app/actions/pje';
import type { ScrapeJobWithRelations, ScrapeJobStatus, ScrapeType } from '@/lib/types/scraping';

interface ScrapeHistoryProps {
  /** Callback when user clicks to view job details */
  onViewDetails?: (jobId: string) => void;
  /** Refresh trigger */
  refreshTrigger?: number;
}

export function ScrapeHistory({ onViewDetails, refreshTrigger }: ScrapeHistoryProps) {
  const [jobs, setJobs] = useState<ScrapeJobWithRelations[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Filters
  const [statusFilter, setStatusFilter] = useState<ScrapeJobStatus | 'all'>('all');
  const [typeFilter, setTypeFilter] = useState<ScrapeType | 'all'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFrom, setDateFrom] = useState<Date | undefined>(undefined);
  const [dateTo, setDateTo] = useState<Date | undefined>(undefined);

  useEffect(() => {
    fetchJobs();
  }, [page, statusFilter, typeFilter, searchTerm, dateFrom, dateTo, refreshTrigger]);

  const fetchJobs = async () => {
    setIsLoading(true);
    try {
      const result = await listScrapeJobsAction({
        page,
        pageSize: 50,
        status: statusFilter !== 'all' ? [statusFilter as ScrapeJobStatus] : undefined,
        scrapeType: typeFilter !== 'all' ? [typeFilter as ScrapeType] : undefined,
        tribunalSearch: searchTerm || undefined,
        startDate: dateFrom,
        endDate: dateTo,
      });

      if (result.success && result.data) {
        setJobs(result.data.jobs);
        setTotalPages(result.data.totalPages);
      }
    } catch (error) {
      console.error('Error fetching jobs:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadge = (status: ScrapeJobStatus) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary">Aguardando</Badge>;
      case 'running':
        return (
          <Badge variant="default" className="bg-blue-500">
            Em Execução
          </Badge>
        );
      case 'completed':
        return <Badge variant="default" className="bg-green-500">Concluído</Badge>;
      case 'failed':
        return <Badge variant="destructive">Falhou</Badge>;
      case 'canceled':
        return <Badge variant="outline">Cancelado</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const getScrapeTypeLabel = (type: ScrapeType): string => {
    switch (type) {
      case 'acervo_geral':
        return 'Acervo Geral';
      case 'pendentes':
        return 'Pendentes';
      case 'arquivados':
        return 'Arquivados';
      case 'minha_pauta':
        return 'Minha Pauta';
      default:
        return type;
    }
  };

  const getSuccessRate = (job: ScrapeJobWithRelations): string => {
    const total = job.tribunals.length;
    const completed = job.tribunals.filter((t) => t.status === 'completed').length;
    return `${completed}/${total}`;
  };

  const formatDate = (date: Date | string): string => {
    const d = typeof date === 'string' ? new Date(date) : date;
    return format(d, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
  };

  const resetFilters = () => {
    setStatusFilter('all');
    setTypeFilter('all');
    setSearchTerm('');
    setDateFrom(undefined);
    setDateTo(undefined);
    setPage(1);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Histórico de Raspagens</CardTitle>
        <CardDescription>Visualize e filtre jobs de raspagem anteriores</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Filters */}
        <div className="flex flex-wrap gap-4">
          {/* Status Filter */}
          <Select
            value={statusFilter}
            onValueChange={(value) => {
              setStatusFilter(value as ScrapeJobStatus | 'all');
              setPage(1);
            }}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os status</SelectItem>
              <SelectItem value="pending">Aguardando</SelectItem>
              <SelectItem value="running">Em Execução</SelectItem>
              <SelectItem value="completed">Concluído</SelectItem>
              <SelectItem value="failed">Falhou</SelectItem>
              <SelectItem value="canceled">Cancelado</SelectItem>
            </SelectContent>
          </Select>

          {/* Type Filter */}
          <Select
            value={typeFilter}
            onValueChange={(value) => {
              setTypeFilter(value as ScrapeType | 'all');
              setPage(1);
            }}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os tipos</SelectItem>
              <SelectItem value="acervo_geral">Acervo Geral</SelectItem>
              <SelectItem value="pendentes">Pendentes</SelectItem>
              <SelectItem value="arquivados">Arquivados</SelectItem>
              <SelectItem value="minha_pauta">Minha Pauta</SelectItem>
            </SelectContent>
          </Select>

          {/* Date Range */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-[200px] justify-start text-left font-normal">
                <CalendarIcon className="mr-2 h-4 w-4" />
                {dateFrom ? format(dateFrom, 'dd/MM/yyyy', { locale: ptBR }) : 'Data inicial'}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar mode="single" selected={dateFrom} onSelect={setDateFrom} locale={ptBR} />
            </PopoverContent>
          </Popover>

          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-[200px] justify-start text-left font-normal">
                <CalendarIcon className="mr-2 h-4 w-4" />
                {dateTo ? format(dateTo, 'dd/MM/yyyy', { locale: ptBR }) : 'Data final'}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar mode="single" selected={dateTo} onSelect={setDateTo} locale={ptBR} />
            </PopoverContent>
          </Popover>

          {/* Search */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por tribunal..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPage(1);
              }}
              className="pl-9"
            />
          </div>

          {/* Reset Filters */}
          <Button variant="outline" onClick={resetFilters}>
            Limpar Filtros
          </Button>
        </div>

        {/* Table */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : jobs.length === 0 ? (
          <div className="py-12 text-center text-sm text-muted-foreground">
            Nenhum job encontrado com os filtros selecionados
          </div>
        ) : (
          <>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Tribunais</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Taxa de Sucesso</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {jobs.map((job) => (
                    <TableRow key={job.id} className="cursor-pointer hover:bg-muted/50">
                      <TableCell className="font-medium">
                        {formatDate(job.createdAt)}
                      </TableCell>
                      <TableCell>{getScrapeTypeLabel(job.scrapeType as ScrapeType)}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">{job.tribunals.length}</Badge>
                      </TableCell>
                      <TableCell>{getStatusBadge(job.status as ScrapeJobStatus)}</TableCell>
                      <TableCell>
                        <span className="text-sm font-medium">{getSuccessRate(job)}</span>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onViewDetails?.(job.id)}
                        >
                          <Eye className="mr-2 h-4 w-4" />
                          Ver Detalhes
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  Página {page} de {totalPages}
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Anterior
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                  >
                    Próxima
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Search,
  CalendarIcon,
  Download,
  RefreshCw,
  Eye,
  Loader2,
  FileText,
  ChevronLeft,
  ChevronRight,
  Filter,
  AlertCircle,
  ArrowUp,
  ArrowDown,
  MoreVertical,
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';
import { useMediaQuery } from '@/hooks/use-media-query';
import {
  listProcessosAction,
  listTribunalConfigsAction,
  getScrapeExecutionAction,
} from '@/app/actions/pje';
import type {
  ProcessoUnificado,
  PaginatedProcessos,
  ListProcessosFilters,
} from '@/lib/types/scraping';
import { ScrapeType, TribunalFamily } from '@/lib/types/scraping';
import { formatGrau, formatGrauShort } from '@/lib/utils/format-helpers';
import type { TribunalConfigConstant } from '@/lib/constants/tribunais';
import { ScrapeExecutionDetail } from '@/components/pje/scrape-execution-detail';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  getTribunalFamily,
  getScrapeTypeLabel,
  getColumnsByOrigemAndFamily,
  getColumnLabel,
} from '@/lib/utils/tribunal-helpers';
import { ProcessoTableCell } from '@/components/pje/processo-table-columns';

// Tipo estendido para tribunais com UUID
interface TribunalConfigWithUUID extends TribunalConfigConstant {
  uuid: string;
}

// Helpers para formatação de datas que aceitam Date | string
const formatDate = (value: Date | string | null | undefined, formatStr: string): string => {
  if (!value) return '-';
  const date = value instanceof Date ? value : new Date(value);
  if (isNaN(date.getTime())) return '-';
  return format(date, formatStr, { locale: ptBR });
};

const formatDateTime = (value: Date | string | null | undefined): string => {
  return formatDate(value, 'dd/MM/yyyy HH:mm');
};

export default function ProcessosPage() {
  // Estado principal
  const [processos, setProcessos] = useState<ProcessoUnificado[]>([]);
  const [stats, setStats] = useState<{
    porTribunal: Record<string, number>;
    porTipo: Record<ScrapeType, number>;
    ultimaAtualizacao: Date | null;
  }>({
    porTribunal: {},
    porTipo: {} as Record<ScrapeType, number>,
    ultimaAtualizacao: null,
  });
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(50);
  const [totalPages, setTotalPages] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  // Estado de tribunais
  const [tribunais, setTribunais] = useState<TribunalConfigWithUUID[]>([]);
  const [loadingTribunais, setLoadingTribunais] = useState(false);

  // Estado da família selecionada
  const [selectedFamily, setSelectedFamily] = useState<TribunalFamily>(TribunalFamily.TRT);

  // Filtros separados por família
  const [trtFilters, setTrtFilters] = useState<{
    tribunalIds: string[];
    scrapeTypes: ScrapeType[];
    startDate?: Date;
    endDate?: Date;
    searchTerm: string;
  }>({
    tribunalIds: [],
    scrapeTypes: [],
    searchTerm: '',
  });

  const [tjFilters, setTjFilters] = useState<{
    tribunalIds: string[];
    scrapeTypes: ScrapeType[];
    startDate?: Date;
    endDate?: Date;
    searchTerm: string;
  }>({
    tribunalIds: [],
    scrapeTypes: [],
    searchTerm: '',
  });

  // Filtros compartilhados
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'dataAutuacao' | 'dataUltimaAtualizacao' | 'numeroProcesso'>('dataUltimaAtualizacao');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  // Modal/Drawer de detalhes
  const [selectedExecutionId, setSelectedExecutionId] = useState<string | null>(null);
  const [showExecutionDetail, setShowExecutionDetail] = useState(false);
  const isMobile = useMediaQuery('(max-width: 768px)');

  // Carregar tribunais ao montar
  useEffect(() => {
    const fetchTribunais = async () => {
      setLoadingTribunais(true);
      try {
        const result = await listTribunalConfigsAction();
        if (result.success && result.data) {
          setTribunais(result.data as TribunalConfigWithUUID[]);
        } else {
          toast.error('Erro ao carregar tribunais');
        }
      } catch (error) {
        console.error('Erro ao carregar tribunais:', error);
        toast.error('Erro ao carregar tribunais');
      } finally {
        setLoadingTribunais(false);
      }
    };

    fetchTribunais();
  }, []);

  // Carregar processos quando filtros mudarem
  useEffect(() => {
    const fetchProcessos = async () => {
      if (isLoading && !isRefreshing) {
        setIsLoading(true);
      } else if (!isLoading) {
        setIsRefreshing(true);
      }

      try {
        // Obter filtros da família ativa
        const activeFilters = selectedFamily === TribunalFamily.TRT ? trtFilters : tjFilters;
        
        // Converter IDs formatados para UUIDs reais
        const tribunalUUIDs = activeFilters.tribunalIds.length > 0
          ? tribunais
              .filter((t) => activeFilters.tribunalIds.includes(t.id))
              .map((t) => t.uuid)
              .filter((uuid): uuid is string => !!uuid)
          : undefined;

        // Validar searchTerm: mínimo 2 caracteres
        const validatedSearchTerm = (activeFilters.searchTerm || searchTerm).trim().length >= 2 
          ? (activeFilters.searchTerm || searchTerm).trim() 
          : undefined;

        const filters: ListProcessosFilters = {
          page,
          pageSize,
          tribunalConfigIds: tribunalUUIDs,
          scrapeTypes: activeFilters.scrapeTypes.length > 0 ? activeFilters.scrapeTypes : undefined,
          startDate: activeFilters.startDate || startDate,
          endDate: activeFilters.endDate || endDate,
          searchTerm: validatedSearchTerm,
          sortBy,
          sortDirection,
          tribunalFamily: selectedFamily,
        };

        const result = await listProcessosAction(filters);

        if (result.success && result.data) {
          setProcessos(result.data.processos);
          setStats(result.data.stats);
          setTotal(result.data.total);
          setTotalPages(result.data.totalPages);
        } else {
          toast.error(result.error || 'Erro ao carregar processos');
        }
      } catch (error) {
        console.error('Erro ao carregar processos:', error);
        toast.error('Erro ao carregar processos');
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    };

    fetchProcessos();
  }, [
    page,
    pageSize,
    selectedFamily,
    trtFilters,
    tjFilters,
    startDate,
    endDate,
    searchTerm,
    sortBy,
    sortDirection,
    refreshKey,
    tribunais,
  ]);

  // Handlers
  const handleFamilyChange = (value: string) => {
    setSelectedFamily(value as TribunalFamily);
    setPage(1);
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    setRefreshKey(k => k + 1); // Força reload mesmo quando já está na página 1
    toast.success('Atualizando processos...');
  };

  const handleResetFilters = () => {
    if (selectedFamily === TribunalFamily.TRT) {
      setTrtFilters({
        tribunalIds: [],
        scrapeTypes: [],
        searchTerm: '',
      });
    } else {
      setTjFilters({
        tribunalIds: [],
        scrapeTypes: [],
        searchTerm: '',
      });
    }
    setStartDate(undefined);
    setEndDate(undefined);
    setSearchTerm('');
    setPage(1);
  };

  const handleExportCSV = async () => {
    try {
      // Obter filtros da família ativa
      const activeFilters = selectedFamily === TribunalFamily.TRT ? trtFilters : tjFilters;
      
      // Buscar todos os processos do filtro ativo (não apenas a página atual)
      const tribunalUUIDs = activeFilters.tribunalIds.length > 0
        ? tribunais
            .filter((t) => activeFilters.tribunalIds.includes(t.id))
            .map((t) => t.uuid)
            .filter((uuid): uuid is string => !!uuid)
        : undefined;

      const validatedSearchTerm = (activeFilters.searchTerm || searchTerm).trim().length >= 2 
        ? (activeFilters.searchTerm || searchTerm).trim() 
        : undefined;

      const filters: ListProcessosFilters = {
        page: 1,
        pageSize: total, // Buscar todos os resultados
        tribunalConfigIds: tribunalUUIDs,
        scrapeTypes: activeFilters.scrapeTypes.length > 0 ? activeFilters.scrapeTypes : undefined,
        startDate: activeFilters.startDate || startDate,
        endDate: activeFilters.endDate || endDate,
        searchTerm: validatedSearchTerm,
        sortBy,
        sortDirection,
        tribunalFamily: selectedFamily,
      };

      const result = await listProcessosAction(filters);

      if (!result.success || !result.data || result.data.processos.length === 0) {
        toast.error('Nenhum processo disponível para exportar');
        return;
      }

      const allProcessos = result.data.processos;

      // Extrair todas as chaves únicas dos processos
      const allKeys = new Set<string>();
      allProcessos.forEach((processo) => {
        Object.keys(processo).forEach((key) => allKeys.add(key));
      });
      const headers = Array.from(allKeys);

      // Criar header CSV
      const csvLines: string[] = [];
      csvLines.push(headers.map((h) => `"${h}"`).join(','));

      // Criar linhas CSV
      allProcessos.forEach((processo) => {
        const row = headers.map((header) => {
          const value = (processo as any)[header];
          if (value === null || value === undefined) return '""';
          // Escapar aspas e envolver em aspas duplas
          const stringValue = String(value).replace(/"/g, '""');
          return `"${stringValue}"`;
        });
        csvLines.push(row.join(','));
      });

      // Criar Blob e download
      const csvContent = csvLines.join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const date = new Date().toISOString().split('T')[0];
      link.download = `processos-${selectedFamily.toLowerCase()}-${date}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success(`Exportados ${allProcessos.length} processos para CSV`);
    } catch (error) {
      console.error('[Export CSV] Error:', error);
      toast.error('Erro ao exportar CSV');
    }
  };

  const handleExportJSON = async () => {
    try {
      // Obter filtros da família ativa
      const activeFilters = selectedFamily === TribunalFamily.TRT ? trtFilters : tjFilters;
      
      // Buscar todos os processos do filtro ativo (não apenas a página atual)
      const tribunalUUIDs = activeFilters.tribunalIds.length > 0
        ? tribunais
            .filter((t) => activeFilters.tribunalIds.includes(t.id))
            .map((t) => t.uuid)
            .filter((uuid): uuid is string => !!uuid)
        : undefined;

      const validatedSearchTerm = (activeFilters.searchTerm || searchTerm).trim().length >= 2 
        ? (activeFilters.searchTerm || searchTerm).trim() 
        : undefined;

      const filters: ListProcessosFilters = {
        page: 1,
        pageSize: total, // Buscar todos os resultados
        tribunalConfigIds: tribunalUUIDs,
        scrapeTypes: activeFilters.scrapeTypes.length > 0 ? activeFilters.scrapeTypes : undefined,
        startDate: activeFilters.startDate || startDate,
        endDate: activeFilters.endDate || endDate,
        searchTerm: validatedSearchTerm,
        sortBy,
        sortDirection,
        tribunalFamily: selectedFamily,
      };

      const result = await listProcessosAction(filters);

      if (!result.success || !result.data || result.data.processos.length === 0) {
        toast.error('Nenhum processo disponível para exportar');
        return;
      }

      const allProcessos = result.data.processos;

      const jsonData = {
        exportDate: new Date().toISOString(),
        tribunalFamily: selectedFamily,
        totalProcessos: allProcessos.length,
        filters: {
          tribunais: activeFilters.tribunalIds,
          tipos: activeFilters.scrapeTypes,
          datas: {
            inicio: (activeFilters.startDate || startDate)?.toISOString(),
            fim: (activeFilters.endDate || endDate)?.toISOString(),
          },
        },
        stats,
        processos: allProcessos,
      };

      const jsonString = JSON.stringify(jsonData, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const date = new Date().toISOString().split('T')[0];
      link.download = `processos-${selectedFamily.toLowerCase()}-${date}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success(`Exportados ${allProcessos.length} processos para JSON`);
    } catch (error) {
      console.error('[Export JSON] Error:', error);
      toast.error('Erro ao exportar JSON');
    }
  };

  const handleViewExecution = (executionId: string) => {
    setSelectedExecutionId(executionId);
    setShowExecutionDetail(true);
  };

  const handleCloseExecutionDetail = () => {
    setShowExecutionDetail(false);
    setSelectedExecutionId(null);
  };

  const handleSort = (column: 'dataAutuacao' | 'dataUltimaAtualizacao' | 'numeroProcesso') => {
    if (sortBy === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortDirection('desc');
    }
    setPage(1);
  };

  // Agrupar tribunais por tipo usando getTribunalFamily
  const tribunaisAgrupados = useMemo(() => {
    const grupos: Record<TribunalFamily, TribunalConfigConstant[]> = {
      [TribunalFamily.TRT]: [],
      [TribunalFamily.TJ]: [],
      [TribunalFamily.TRF]: [],
      [TribunalFamily.SUPERIOR]: [],
    };

    tribunais.forEach((tribunal) => {
      const family = getTribunalFamily(tribunal.codigo);
      grupos[family].push(tribunal);
    });

    return grupos;
  }, [tribunais]);

  // Verificar se há filtros ativos
  const hasActiveFilters = useMemo(() => {
    const activeFilters = selectedFamily === TribunalFamily.TRT ? trtFilters : tjFilters;
    return (
      activeFilters.tribunalIds.length > 0 ||
      activeFilters.scrapeTypes.length > 0 ||
      (activeFilters.startDate !== undefined) ||
      (activeFilters.endDate !== undefined) ||
      startDate !== undefined ||
      endDate !== undefined ||
      activeFilters.searchTerm.trim().length > 0 ||
      searchTerm.trim().length > 0
    );
  }, [selectedFamily, trtFilters, tjFilters, startDate, endDate, searchTerm]);

  // Determinar colunas dinamicamente baseado na origem e família
  const tableColumns = useMemo(() => {
    if (processos.length === 0) {
      return [];
    }
    
    // Usar origem do primeiro processo como referência
    const origemReferencia = processos[0].origem;
    const columns = getColumnsByOrigemAndFamily(origemReferencia, selectedFamily);
    
    // Adicionar colunas contextuais obrigatórias (Tribunal, Tipo) antes do conjunto dinâmico
    // A coluna númeroProcesso já está incluída no conjunto dinâmico
    return columns;
  }, [processos, selectedFamily]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Processos Raspados</h1>
          <p className="text-muted-foreground">
            Visualize e gerencie todos os processos coletados do PJE
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleRefresh}
            disabled={isRefreshing}
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
          <Button
            variant="outline"
            onClick={handleExportCSV}
            disabled={processos.length === 0}
          >
            <Download className="mr-2 h-4 w-4" />
            Exportar CSV
          </Button>
          <Button
            variant="outline"
            onClick={handleExportJSON}
            disabled={processos.length === 0}
          >
            <Download className="mr-2 h-4 w-4" />
            Exportar JSON
          </Button>
        </div>
      </div>

      {/* Tabs por Família de Tribunal */}
      <Tabs value={selectedFamily} onValueChange={handleFamilyChange} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value={TribunalFamily.TRT}>Justiça do Trabalho (TRT)</TabsTrigger>
          <TabsTrigger value={TribunalFamily.TJ}>Justiça Estadual (TJ)</TabsTrigger>
        </TabsList>

        {/* Conteúdo TRT */}
        <TabsContent value={TribunalFamily.TRT} className="space-y-6">
          {/* Cards de Estatísticas */}
          <div className="grid gap-6 md:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">Total de Processos</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {total.toLocaleString('pt-BR')}
                </div>
                <p className="text-xs text-muted-foreground">
                  {total === 0 ? 'Nenhum processo raspado ainda' : 'processos únicos'}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">Última Atualização</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {stats.ultimaAtualizacao
                    ? formatDate(stats.ultimaAtualizacao, "HH:mm")
                    : '-'}
                </div>
                <p className="text-xs text-muted-foreground">
                  {stats.ultimaAtualizacao
                    ? formatDate(stats.ultimaAtualizacao, "dd/MM/yyyy 'às' HH:mm")
                    : 'Nunca'}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">Por Tipo de Raspagem</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {Object.keys(stats.porTipo).length === 0 ? (
                    <p className="text-xs text-muted-foreground">Nenhum dado</p>
                  ) : (
                    Object.entries(stats.porTipo).map(([tipo, count]) => (
                      <Badge key={tipo} variant="secondary">
                        {getScrapeTypeLabel(tipo as ScrapeType, TribunalFamily.TRT)}: {count}
                      </Badge>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filtros */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="h-4 w-4" />
                Filtros
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-4">
                {/* Filtro de Tribunal (Multi-select via Popover) */}
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-[200px] justify-start">
                      <Filter className="mr-2 h-4 w-4" />
                      Tribunais
                      {trtFilters.tribunalIds.length > 0 && (
                        <Badge variant="secondary" className="ml-2">
                          {trtFilters.tribunalIds.length}
                        </Badge>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[400px] max-h-[400px] overflow-y-auto">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium">Selecionar Tribunais TRT</p>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setTrtFilters({ ...trtFilters, tribunalIds: [] })}
                        >
                          Limpar
                        </Button>
                      </div>
                      {tribunaisAgrupados.TRT.map((tribunal) => {
                        const isSelected = trtFilters.tribunalIds.includes(tribunal.id);
                        return (
                          <label
                            key={tribunal.id}
                            className="flex items-center space-x-2 cursor-pointer hover:bg-muted p-2 rounded"
                          >
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => {
                                if (isSelected) {
                                  setTrtFilters({ 
                                    ...trtFilters, 
                                    tribunalIds: trtFilters.tribunalIds.filter((id) => id !== tribunal.id) 
                                  });
                                } else {
                                  setTrtFilters({ 
                                    ...trtFilters, 
                                    tribunalIds: [...trtFilters.tribunalIds, tribunal.id] 
                                  });
                                }
                                setPage(1);
                              }}
                              className="rounded border-gray-300"
                            />
                            <span className="text-sm">{tribunal.nome}</span>
                          </label>
                        );
                      })}
                    </div>
                  </PopoverContent>
                </Popover>

                {/* Filtro de Tipo de Raspagem */}
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-[200px] justify-start">
                      <Filter className="mr-2 h-4 w-4" />
                      Tipo
                      {trtFilters.scrapeTypes.length > 0 && (
                        <Badge variant="secondary" className="ml-2">
                          {trtFilters.scrapeTypes.length}
                        </Badge>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[250px]">
                    <div className="space-y-2">
                      <p className="text-sm font-medium">Tipos de Raspagem</p>
                      {Object.values(ScrapeType).map((tipo) => {
                        const isSelected = trtFilters.scrapeTypes.includes(tipo);
                        return (
                          <label
                            key={tipo}
                            className="flex items-center space-x-2 cursor-pointer hover:bg-muted p-2 rounded"
                          >
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => {
                                if (isSelected) {
                                  setTrtFilters({ 
                                    ...trtFilters, 
                                    scrapeTypes: trtFilters.scrapeTypes.filter((t) => t !== tipo) 
                                  });
                                } else {
                                  setTrtFilters({ 
                                    ...trtFilters, 
                                    scrapeTypes: [...trtFilters.scrapeTypes, tipo] 
                                  });
                                }
                                setPage(1);
                              }}
                              className="rounded border-gray-300"
                            />
                            <span className="text-sm">{getScrapeTypeLabel(tipo, selectedFamily)}</span>
                          </label>
                        );
                      })}
                    </div>
                  </PopoverContent>
                </Popover>

            {/* Data Inicial */}
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-[200px] justify-start text-left font-normal">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {startDate ? format(startDate, 'dd/MM/yyyy', { locale: ptBR }) : 'Data inicial'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={startDate}
                  onSelect={(date) => {
                    setStartDate(date);
                    setPage(1);
                  }}
                  locale={ptBR}
                />
              </PopoverContent>
            </Popover>

            {/* Data Final */}
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-[200px] justify-start text-left font-normal">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {endDate ? format(endDate, 'dd/MM/yyyy', { locale: ptBR }) : 'Data final'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={endDate}
                  onSelect={(date) => {
                    setEndDate(date);
                    setPage(1);
                  }}
                  locale={ptBR}
                />
              </PopoverContent>
            </Popover>

                {/* Busca Textual */}
                <div className="relative flex-1 min-w-[200px]">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar por número, partes, órgão... (mín. 2 caracteres)"
                    value={trtFilters.searchTerm || searchTerm}
                    onChange={(e) => {
                      setTrtFilters({ ...trtFilters, searchTerm: e.target.value });
                      setPage(1);
                    }}
                    className="pl-9"
                  />
                </div>

                {/* Botão Limpar Filtros */}
                <Button
                  variant="outline"
                  onClick={handleResetFilters}
                  disabled={!hasActiveFilters}
                >
                  Limpar Filtros
                </Button>
              </div>
            </CardContent>
          </Card>

      {/* Tabela de Processos */}
      <Card>
        <CardHeader>
          <CardTitle>Tabela de Processos</CardTitle>
          <CardDescription>
            {total} processos únicos encontrados
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : processos.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <FileText className="mb-4 h-12 w-12 text-muted-foreground" />
              <h3 className="mb-2 text-lg font-semibold">Nenhum processo encontrado</h3>
              <p className="mb-4 text-sm text-muted-foreground">
                Nenhum processo encontrado com os filtros selecionados
              </p>
            </div>
          ) : (
            <>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      {/* Colunas contextuais obrigatórias */}
                      <TableHead
                        className="cursor-pointer hover:bg-muted"
                        onClick={() => handleSort('numeroProcesso')}
                      >
                        <div className="flex items-center gap-2">
                          Número do Processo
                          {sortBy === 'numeroProcesso' &&
                            (sortDirection === 'asc' ? (
                              <ArrowUp className="h-4 w-4" />
                            ) : (
                              <ArrowDown className="h-4 w-4" />
                            ))}
                        </div>
                      </TableHead>
                      <TableHead>Tribunal</TableHead>
                      <TableHead>Tipo</TableHead>
                      {/* Colunas dinâmicas baseadas em origem e família */}
                      {tableColumns.map((col) => {
                        // Pular númeroProcesso e dataUltimaAtualizacao pois já estão nas colunas contextuais
                        if (col === 'numeroProcesso' || col === 'numero' || col === 'dataUltimaAtualizacao') return null;
                        
                        const isSortable = col === 'dataAutuacao';
                        return (
                          <TableHead
                            key={col}
                            className={isSortable ? 'cursor-pointer hover:bg-muted' : ''}
                            onClick={isSortable ? () => handleSort('dataAutuacao') : undefined}
                          >
                            {isSortable ? (
                              <div className="flex items-center gap-2">
                                {getColumnLabel(col, selectedFamily)}
                                {sortBy === col &&
                                  (sortDirection === 'asc' ? (
                                    <ArrowUp className="h-4 w-4" />
                                  ) : (
                                    <ArrowDown className="h-4 w-4" />
                                  ))}
                              </div>
                            ) : (
                              getColumnLabel(col, selectedFamily)
                            )}
                          </TableHead>
                        );
                      })}
                      <TableHead
                        className="cursor-pointer hover:bg-muted"
                        onClick={() => handleSort('dataUltimaAtualizacao')}
                      >
                        <div className="flex items-center gap-2">
                          Última Atualização
                          {sortBy === 'dataUltimaAtualizacao' &&
                            (sortDirection === 'asc' ? (
                              <ArrowUp className="h-4 w-4" />
                            ) : (
                              <ArrowDown className="h-4 w-4" />
                            ))}
                        </div>
                      </TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {processos.map((processo) => {
                      const processoColumns = getColumnsByOrigemAndFamily(processo.origem, selectedFamily);
                      return (
                        <TableRow key={processo.id} className="hover:bg-muted/50">
                          {/* Colunas contextuais obrigatórias */}
                          <TableCell className="font-mono font-medium">
                            {processo.numeroProcesso}
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary">
                              {processo.tribunalCodigo} {formatGrauShort(processo.grau)}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {getScrapeTypeLabel(processo.tipoRaspagem, selectedFamily)}
                            </Badge>
                          </TableCell>
                          {/* Colunas dinâmicas baseadas em origem e família */}
                          {processoColumns.map((col) => {
                            // Pular númeroProcesso e dataUltimaAtualizacao pois já estão nas colunas contextuais
                            if (col === 'numeroProcesso' || col === 'numero' || col === 'dataUltimaAtualizacao') return null;
                            
                            return (
                              <TableCell key={col}>
                                <ProcessoTableCell 
                                  processo={processo} 
                                  column={col} 
                                  tribunalFamily={selectedFamily} 
                                />
                              </TableCell>
                            );
                          })}
                          <TableCell>
                            {formatDateTime(processo.dataUltimaAtualizacao)}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleViewExecution(processo.scrapeExecutionId)}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="sm">
                                    <MoreVertical className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => handleViewExecution(processo.scrapeExecutionId)}>
                                    Ver Detalhes
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => navigator.clipboard.writeText(processo.numeroProcesso)}>
                                    Copiar Número
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>

              {/* Paginação */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <p className="text-sm text-muted-foreground">
                    Página {page} de {totalPages} • Total: {total.toLocaleString('pt-BR')} processos
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
        </TabsContent>

        {/* Conteúdo TJ */}
        <TabsContent value={TribunalFamily.TJ} className="space-y-6">
          {/* Cards de Estatísticas */}
          <div className="grid gap-6 md:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">Total de Processos</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {total.toLocaleString('pt-BR')}
                </div>
                <p className="text-xs text-muted-foreground">
                  {total === 0 ? 'Nenhum processo raspado ainda' : 'processos únicos'}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">Última Atualização</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {stats.ultimaAtualizacao
                    ? formatDate(stats.ultimaAtualizacao, "HH:mm")
                    : '-'}
                </div>
                <p className="text-xs text-muted-foreground">
                  {stats.ultimaAtualizacao
                    ? formatDate(stats.ultimaAtualizacao, "dd/MM/yyyy 'às' HH:mm")
                    : 'Nunca'}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">Por Tipo de Raspagem</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {Object.keys(stats.porTipo).length === 0 ? (
                    <p className="text-xs text-muted-foreground">Nenhum dado</p>
                  ) : (
                    Object.entries(stats.porTipo).map(([tipo, count]) => (
                      <Badge key={tipo} variant="secondary">
                        {getScrapeTypeLabel(tipo as ScrapeType, TribunalFamily.TJ)}: {count}
                      </Badge>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filtros TJ */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="h-4 w-4" />
                Filtros
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-4">
                {/* Filtro de Tribunal TJ */}
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-[200px] justify-start">
                      <Filter className="mr-2 h-4 w-4" />
                      Tribunais
                      {tjFilters.tribunalIds.length > 0 && (
                        <Badge variant="secondary" className="ml-2">
                          {tjFilters.tribunalIds.length}
                        </Badge>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[400px] max-h-[400px] overflow-y-auto">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium">Selecionar Tribunais TJ</p>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setTjFilters({ ...tjFilters, tribunalIds: [] })}
                        >
                          Limpar
                        </Button>
                      </div>
                      {tribunaisAgrupados.TJ.map((tribunal) => {
                        const isSelected = tjFilters.tribunalIds.includes(tribunal.id);
                        return (
                          <label
                            key={tribunal.id}
                            className="flex items-center space-x-2 cursor-pointer hover:bg-muted p-2 rounded"
                          >
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => {
                                if (isSelected) {
                                  setTjFilters({ 
                                    ...tjFilters, 
                                    tribunalIds: tjFilters.tribunalIds.filter((id) => id !== tribunal.id) 
                                  });
                                } else {
                                  setTjFilters({ 
                                    ...tjFilters, 
                                    tribunalIds: [...tjFilters.tribunalIds, tribunal.id] 
                                  });
                                }
                                setPage(1);
                              }}
                              className="rounded border-gray-300"
                            />
                            <span className="text-sm">{tribunal.nome}</span>
                          </label>
                        );
                      })}
                    </div>
                  </PopoverContent>
                </Popover>

                {/* Filtro de Tipo de Raspagem TJ */}
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-[200px] justify-start">
                      <Filter className="mr-2 h-4 w-4" />
                      Tipo
                      {tjFilters.scrapeTypes.length > 0 && (
                        <Badge variant="secondary" className="ml-2">
                          {tjFilters.scrapeTypes.length}
                        </Badge>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[250px]">
                    <div className="space-y-2">
                      <p className="text-sm font-medium">Tipos de Raspagem</p>
                      {Object.values(ScrapeType).map((tipo) => {
                        const isSelected = tjFilters.scrapeTypes.includes(tipo);
                        return (
                          <label
                            key={tipo}
                            className="flex items-center space-x-2 cursor-pointer hover:bg-muted p-2 rounded"
                          >
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => {
                                if (isSelected) {
                                  setTjFilters({ 
                                    ...tjFilters, 
                                    scrapeTypes: tjFilters.scrapeTypes.filter((t) => t !== tipo) 
                                  });
                                } else {
                                  setTjFilters({ 
                                    ...tjFilters, 
                                    scrapeTypes: [...tjFilters.scrapeTypes, tipo] 
                                  });
                                }
                                setPage(1);
                              }}
                              className="rounded border-gray-300"
                            />
                            <span className="text-sm">{getScrapeTypeLabel(tipo, selectedFamily)}</span>
                          </label>
                        );
                      })}
                    </div>
                  </PopoverContent>
                </Popover>

                {/* Busca Textual TJ */}
                <div className="relative flex-1 min-w-[200px]">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar por número, partes, órgão... (mín. 2 caracteres)"
                    value={tjFilters.searchTerm || searchTerm}
                    onChange={(e) => {
                      setTjFilters({ ...tjFilters, searchTerm: e.target.value });
                      setPage(1);
                    }}
                    className="pl-9"
                  />
                </div>

                {/* Botão Limpar Filtros TJ */}
                <Button
                  variant="outline"
                  onClick={handleResetFilters}
                  disabled={!hasActiveFilters}
                >
                  Limpar Filtros
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Tabela de Processos TJ */}
          <Card>
            <CardHeader>
              <CardTitle>Tabela de Processos</CardTitle>
              <CardDescription>
                {total} processos únicos encontrados
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-4">
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                </div>
              ) : processos.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <FileText className="mb-4 h-12 w-12 text-muted-foreground" />
                  <h3 className="mb-2 text-lg font-semibold">Nenhum processo encontrado</h3>
                  <p className="mb-4 text-sm text-muted-foreground">
                    Nenhum processo encontrado com os filtros selecionados
                  </p>
                </div>
              ) : (
                <>
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          {/* Colunas contextuais obrigatórias */}
                          <TableHead
                            className="cursor-pointer hover:bg-muted"
                            onClick={() => handleSort('numeroProcesso')}
                          >
                            <div className="flex items-center gap-2">
                              Número do Processo
                              {sortBy === 'numeroProcesso' &&
                                (sortDirection === 'asc' ? (
                                  <ArrowUp className="h-4 w-4" />
                                ) : (
                                  <ArrowDown className="h-4 w-4" />
                                ))}
                            </div>
                          </TableHead>
                          <TableHead>Tribunal</TableHead>
                          <TableHead>Tipo</TableHead>
                          {/* Colunas dinâmicas baseadas em origem e família */}
                          {tableColumns.map((col) => {
                            // Pular númeroProcesso e dataUltimaAtualizacao pois já estão nas colunas contextuais
                            if (col === 'numeroProcesso' || col === 'numero' || col === 'dataUltimaAtualizacao') return null;
                            
                            const isSortable = col === 'dataAutuacao';
                            return (
                              <TableHead
                                key={col}
                                className={isSortable ? 'cursor-pointer hover:bg-muted' : ''}
                                onClick={isSortable ? () => handleSort('dataAutuacao') : undefined}
                              >
                                {isSortable ? (
                                  <div className="flex items-center gap-2">
                                    {getColumnLabel(col, selectedFamily)}
                                    {sortBy === col &&
                                      (sortDirection === 'asc' ? (
                                        <ArrowUp className="h-4 w-4" />
                                      ) : (
                                        <ArrowDown className="h-4 w-4" />
                                      ))}
                                  </div>
                                ) : (
                                  getColumnLabel(col, selectedFamily)
                                )}
                              </TableHead>
                            );
                          })}
                          <TableHead
                            className="cursor-pointer hover:bg-muted"
                            onClick={() => handleSort('dataUltimaAtualizacao')}
                          >
                            <div className="flex items-center gap-2">
                              Última Atualização
                              {sortBy === 'dataUltimaAtualizacao' &&
                                (sortDirection === 'asc' ? (
                                  <ArrowUp className="h-4 w-4" />
                                ) : (
                                  <ArrowDown className="h-4 w-4" />
                                ))}
                            </div>
                          </TableHead>
                          <TableHead className="text-right">Ações</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {processos.map((processo) => {
                          const processoColumns = getColumnsByOrigemAndFamily(processo.origem, selectedFamily);
                          return (
                            <TableRow key={processo.id} className="hover:bg-muted/50">
                              {/* Colunas contextuais obrigatórias */}
                              <TableCell className="font-mono font-medium">
                                {processo.numeroProcesso}
                              </TableCell>
                              <TableCell>
                                <Badge variant="secondary">
                                  {processo.tribunalCodigo} {formatGrauShort(processo.grau)}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline">
                                  {getScrapeTypeLabel(processo.tipoRaspagem, selectedFamily)}
                                </Badge>
                              </TableCell>
                              {/* Colunas dinâmicas baseadas em origem e família */}
                              {processoColumns.map((col) => {
                                // Pular númeroProcesso e dataUltimaAtualizacao pois já estão nas colunas contextuais
                                if (col === 'numeroProcesso' || col === 'numero' || col === 'dataUltimaAtualizacao') return null;
                                
                                return (
                                  <TableCell key={col}>
                                    <ProcessoTableCell 
                                      processo={processo} 
                                      column={col} 
                                      tribunalFamily={selectedFamily} 
                                    />
                                  </TableCell>
                                );
                              })}
                              <TableCell>
                                {formatDateTime(processo.dataUltimaAtualizacao)}
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="flex items-center justify-end gap-2">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleViewExecution(processo.scrapeExecutionId)}
                                  >
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button variant="ghost" size="sm">
                                        <MoreVertical className="h-4 w-4" />
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                      <DropdownMenuItem onClick={() => handleViewExecution(processo.scrapeExecutionId)}>
                                        Ver Detalhes
                                      </DropdownMenuItem>
                                      <DropdownMenuItem onClick={() => navigator.clipboard.writeText(processo.numeroProcesso)}>
                                        Copiar Número
                                      </DropdownMenuItem>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                </div>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>

                  {/* Paginação */}
                  {totalPages > 1 && (
                    <div className="flex items-center justify-between mt-4">
                      <p className="text-sm text-muted-foreground">
                        Página {page} de {totalPages} • Total: {total.toLocaleString('pt-BR')} processos
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
        </TabsContent>
      </Tabs>

      {/* Modal/Drawer de Detalhes da Execução */}
      {isMobile ? (
        <Drawer open={showExecutionDetail} onOpenChange={setShowExecutionDetail}>
          <DrawerContent className="max-h-[90vh]">
            <DrawerHeader>
              <DrawerTitle>Detalhes da Execução</DrawerTitle>
            </DrawerHeader>
            <div className="overflow-y-auto px-4 pb-4">
              {selectedExecutionId && (
                <ScrapeExecutionDetail executionId={selectedExecutionId} />
              )}
            </div>
          </DrawerContent>
        </Drawer>
      ) : (
        <Dialog open={showExecutionDetail} onOpenChange={setShowExecutionDetail}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Detalhes da Execução</DialogTitle>
            </DialogHeader>
            {selectedExecutionId && (
              <ScrapeExecutionDetail executionId={selectedExecutionId} />
            )}
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

/**
 * Results Table View Component
 * Displays scraped processes in a sortable, filterable table
 */

'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { useLocalStorage } from '@/hooks/use-local-storage';
import { useDebounce } from '@/hooks/use-debounce';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ArrowUpDown,
  Search,
  X,
  Columns,
  Eye,
  EyeOff,
} from 'lucide-react';
import type { ScrapeJobWithRelations } from '@/lib/types/scraping';

interface ResultsTableViewProps {
  job: ScrapeJobWithRelations;
  allProcesses: any[];
}

interface ProcessData {
  numeroProcesso?: string;
  polo?: string;
  natureza?: string;
  assunto?: string;
  movimentacao?: string;
  [key: string]: any;
}

type SortDirection = 'asc' | 'desc' | null;

export function ResultsTableView({ job, allProcesses }: ResultsTableViewProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set());
  const tableContainerRef = useRef<HTMLDivElement>(null);

  // Detect tribunal type
  const isTJMG = useMemo(() => {
    if (allProcesses.length === 0) return false;
    return allProcesses.some((process) => 'regiao' in process);
  }, [allProcesses]);

  const storageKey = `pje-table-columns-${isTJMG ? 'tjmg' : 'default'}`;

  // Get default visible columns
  const getDefaultColumns = (): string[] => {
    if (allProcesses.length === 0) return [];

    const columnsSet = new Set<string>();
    allProcesses.forEach((process) => {
      Object.keys(process).forEach((key) => columnsSet.add(key));
    });

    const priorityColumns = isTJMG
      ? ['numero', 'regiao', 'tipo', 'partes', 'vara']
      : ['numeroProcesso', 'polo', 'natureza', 'assunto'];

    const filteredPriorityColumns = priorityColumns.filter((col) => columnsSet.has(col));

    // Fallback: if no priority columns exist but there are columns available, show first 4
    if (filteredPriorityColumns.length === 0 && columnsSet.size > 0) {
      return Array.from(columnsSet).slice(0, 4);
    }

    return filteredPriorityColumns;
  };

  // Use localStorage hook with Set serialization
  const [visibleColumnsArray, setVisibleColumnsArray] = useLocalStorage<string[]>(
    storageKey,
    getDefaultColumns,
    {
      initializeWithValue: false, // SSR-safe
    }
  );

  // Convert array to Set for easier manipulation
  const [visibleColumns, setVisibleColumns] = useState<Set<string>>(() => new Set(visibleColumnsArray));

  // Debounce visible columns changes before saving to localStorage
  const debouncedVisibleColumnsArray = useDebounce(Array.from(visibleColumns), 500);

  // Sync debounced changes to localStorage
  useEffect(() => {
    setVisibleColumnsArray(debouncedVisibleColumnsArray);
  }, [debouncedVisibleColumnsArray, setVisibleColumnsArray]);

  // Sync visibleColumns from localStorage on mount
  useEffect(() => {
    if (visibleColumnsArray.length > 0) {
      setVisibleColumns(new Set(visibleColumnsArray));
    }
  }, [visibleColumnsArray]);

  // Clear selection when filters or sorting changes
  useEffect(() => {
    setSelectedRows(new Set());
  }, [searchTerm, sortColumn, sortDirection]);

  // Filter processes by search term
  const filteredProcesses = useMemo(() => {
    if (!searchTerm.trim()) return allProcesses;

    const term = searchTerm.toLowerCase();
    return allProcesses.filter((process) => {
      return Object.values(process).some((value) => {
        if (value === null || value === undefined) return false;
        return String(value).toLowerCase().includes(term);
      });
    });
  }, [allProcesses, searchTerm]);

  // Sort processes
  const sortedProcesses = useMemo(() => {
    if (!sortColumn || !sortDirection) return filteredProcesses;

    return [...filteredProcesses].sort((a, b) => {
      const aValue = a[sortColumn];
      const bValue = b[sortColumn];

      // Handle null/undefined
      if (aValue === null || aValue === undefined) return sortDirection === 'asc' ? 1 : -1;
      if (bValue === null || bValue === undefined) return sortDirection === 'asc' ? -1 : 1;

      // Compare values
      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filteredProcesses, sortColumn, sortDirection]);

  // Paginate processes
  const paginatedProcesses = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return sortedProcesses.slice(startIndex, startIndex + pageSize);
  }, [sortedProcesses, currentPage, pageSize]);

  // Virtualizer para renderizar apenas linhas visíveis
  const rowVirtualizer = useVirtualizer({
    count: paginatedProcesses.length,
    getScrollElement: () => tableContainerRef.current,
    estimateSize: () => 48, // Altura estimada de cada linha em pixels
    overscan: 5, // Renderizar 5 linhas extras acima/abaixo do viewport
  });

  // Calculate pagination info
  const totalPages = Math.ceil(sortedProcesses.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize + 1;
  const endIndex = Math.min(currentPage * pageSize, sortedProcesses.length);

  // Get unique columns from data
  const columns = useMemo(() => {
    if (allProcesses.length === 0) return [];

    const columnsSet = new Set<string>();
    allProcesses.forEach((process) => {
      Object.keys(process).forEach((key) => columnsSet.add(key));
    });

    // Detect if this is TJMG data (has 'numero' and 'regiao' fields)
    const isTJMG = columnsSet.has('regiao');

    // Prioritize common columns based on tribunal type
    const priorityColumns = isTJMG
      ? ['numero', 'regiao', 'tipo', 'partes', 'vara', 'dataDistribuicao', 'ultimoMovimento']
      : ['numeroProcesso', 'polo', 'natureza', 'assunto', 'movimentacao'];

    const otherColumns = Array.from(columnsSet).filter((col) => !priorityColumns.includes(col));

    const allColumns = [...priorityColumns.filter((col) => columnsSet.has(col)), ...otherColumns];
    
    // Filter by visible columns
    const displayedColumns = allColumns.filter((col) => visibleColumns.has(col));
    
    return { allColumns, displayedColumns };
  }, [allProcesses, visibleColumns]);

  // Sync visible columns when columns change (edge case handling)
  useEffect(() => {
    const columnsSet = new Set<string>();
    allProcesses.forEach((process) => {
      Object.keys(process).forEach((key) => columnsSet.add(key));
    });
    
    // Remove columns from visibleColumns that no longer exist
    const newVisibleColumns = new Set(visibleColumns);
    let hasChanges = false;
    
    visibleColumns.forEach((col) => {
      if (!columnsSet.has(col)) {
        newVisibleColumns.delete(col);
        hasChanges = true;
      }
    });
    
    // If visibleColumns is empty after cleanup, restore defaults
    if (newVisibleColumns.size === 0 && columnsSet.size > 0) {
      const isTJMG = columnsSet.has('regiao');
      const priorityColumns = isTJMG
        ? ['numero', 'regiao', 'tipo', 'partes', 'vara']
        : ['numeroProcesso', 'polo', 'natureza', 'assunto'];
      priorityColumns.forEach((col) => {
        if (columnsSet.has(col)) {
          newVisibleColumns.add(col);
        }
      });
      hasChanges = true;
    }
    
    if (hasChanges) {
      setVisibleColumns(newVisibleColumns);
    }
  }, [allProcesses]);

  // Handle sort
  const handleSort = (column: string) => {
    if (sortColumn === column) {
      // Cycle through: asc -> desc -> null
      if (sortDirection === 'asc') {
        setSortDirection('desc');
      } else if (sortDirection === 'desc') {
        setSortColumn(null);
        setSortDirection(null);
      }
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  // Handle row selection
  const handleRowSelect = (index: number) => {
    const newSelected = new Set(selectedRows);
    if (newSelected.has(index)) {
      newSelected.delete(index);
    } else {
      newSelected.add(index);
    }
    setSelectedRows(newSelected);
  };

  // Handle select all (only current page)
  const handleSelectAll = () => {
    const start = (currentPage - 1) * pageSize;
    const count = paginatedProcesses.length;
    const end = start + count;

    // Check if entire current page is selected
    let allPageSelected = true;
    for (let i = start; i < end; i++) {
      if (!selectedRows.has(i)) {
        allPageSelected = false;
        break;
      }
    }

    const newSelected = new Set(selectedRows);
    if (allPageSelected) {
      // Unselect all indices on current page
      for (let i = start; i < end; i++) {
        newSelected.delete(i);
      }
    } else {
      // Select all indices on current page
      for (let i = start; i < end; i++) {
        newSelected.add(i);
      }
    }
    setSelectedRows(newSelected);
  };

  // Toggle column visibility
  const toggleColumn = (column: string) => {
    const newVisibleColumns = new Set(visibleColumns);
    
    if (newVisibleColumns.has(column)) {
      // Don't allow hiding the last column
      if (newVisibleColumns.size === 1) {
        return; // Keep at least one column visible
      }
      newVisibleColumns.delete(column);
    } else {
      newVisibleColumns.add(column);
    }
    
    setVisibleColumns(newVisibleColumns);
  };

  // Toggle all columns (show all or only essentials)
  const toggleAllColumns = (show: boolean) => {
    if (allProcesses.length === 0) return;
    
    const columnsSet = new Set<string>();
    allProcesses.forEach((process) => {
      Object.keys(process).forEach((key) => columnsSet.add(key));
    });
    const isTJMG = columnsSet.has('regiao');
    
    if (show) {
      // Show all columns
      setVisibleColumns(columnsSet);
    } else {
      // Show only priority columns
      const priorityColumns = isTJMG
        ? ['numero', 'regiao', 'tipo', 'partes', 'vara']
        : ['numeroProcesso', 'polo', 'natureza', 'assunto'];
      setVisibleColumns(new Set(priorityColumns.filter((col) => columnsSet.has(col))));
    }
  };

  // Format cell value
  const formatCellValue = (value: any): string => {
    if (value === null || value === undefined) return '-';
    if (typeof value === 'object') return JSON.stringify(value);
    return String(value);
  };

  // Get column label
  const getColumnLabel = (column: string): string => {
    const labels: Record<string, string> = {
      numeroProcesso: 'Número do Processo',
      polo: 'Polo',
      natureza: 'Natureza',
      assunto: 'Assunto',
      movimentacao: 'Movimentação',
      numero: 'Número do Processo',
      regiao: 'Região',
      tipo: 'Tipo',
      partes: 'Partes',
      vara: 'Vara',
      dataDistribuicao: 'Data de Distribuição',
      ultimoMovimento: 'Último Movimento',
    };
    return labels[column] || (column.charAt(0).toUpperCase() + column.slice(1));
  };

  // Get priority columns for current tribunal type
  const getPriorityColumns = (): string[] => {
    if (allProcesses.length === 0) return [];
    
    const columnsSet = new Set<string>();
    allProcesses.forEach((process) => {
      Object.keys(process).forEach((key) => columnsSet.add(key));
    });
    const isTJMG = columnsSet.has('regiao');
    
    return isTJMG
      ? ['numero', 'regiao', 'tipo', 'partes', 'vara']
      : ['numeroProcesso', 'polo', 'natureza', 'assunto'];
  };

  if (allProcesses.length === 0) {
    return (
      <Card className="p-8 text-center">
        <p className="text-muted-foreground">Nenhum processo encontrado neste job.</p>
      </Card>
    );
  }

  const priorityColumns = getPriorityColumns();
  const allColumns = columns.allColumns || [];
  const displayedColumns = columns.displayedColumns || [];

  return (
    <TooltipProvider>
      <div className="space-y-4">
        {/* Toolbar */}
        <div className="flex items-center justify-between gap-4">
        <div className="flex-1 flex items-center gap-2">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-foreground/70" />
            <Input
              placeholder="Buscar em todos os campos..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1); // Reset to first page on search
              }}
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
          {selectedRows.size > 0 && (
            <Badge variant="secondary">
              {selectedRows.size} selecionado{selectedRows.size > 1 ? 's' : ''}
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-foreground/70 whitespace-nowrap">Linhas por página:</span>
          <Select value={String(pageSize)} onValueChange={(value) => {
            setPageSize(Number(value));
            setCurrentPage(1);
          }}>
            <SelectTrigger className="w-20">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="25">25</SelectItem>
              <SelectItem value="50">50</SelectItem>
              <SelectItem value="100">100</SelectItem>
              <SelectItem value="200">200</SelectItem>
            </SelectContent>
          </Select>
          <div className="h-6 w-px bg-border" />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" aria-label="Selecionar colunas visíveis" aria-expanded={false}>
                <Columns className="h-4 w-4 mr-2" />
                Colunas ({visibleColumns.size}/{allColumns.length})
                {visibleColumns.size < allColumns.length && (
                  <Badge variant="secondary" className="ml-2">
                    {allColumns.length - visibleColumns.size}
                  </Badge>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64">
              <DropdownMenuLabel>Selecionar Colunas</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => toggleAllColumns(true)}>
                <Eye className="h-4 w-4 mr-2" />
                Mostrar Todas
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => toggleAllColumns(false)}>
                <EyeOff className="h-4 w-4 mr-2" />
                Apenas Essenciais
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {allColumns.map((column) => (
                <DropdownMenuCheckboxItem
                  key={column}
                  checked={visibleColumns.has(column)}
                  onCheckedChange={() => toggleColumn(column)}
                >
                  {getColumnLabel(column)}
                  {priorityColumns.includes(column) && (
                    <Badge variant="outline" className="ml-2 text-xs">
                      Essencial
                    </Badge>
                  )}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Table */}
      <div
        ref={tableContainerRef}
        className="rounded-md border border-border overflow-x-auto overflow-y-auto bg-card"
        style={{ height: paginatedProcesses.length > 50 ? '600px' : 'auto' }}
      >
        <Table noWrapper>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <Checkbox
                  aria-label="Selecionar todos os processos da página"
                  checked={(() => {
                    const start = (currentPage - 1) * pageSize;
                    const count = paginatedProcesses.length;
                    const end = start + count;
                    if (count === 0) return false;
                    for (let i = start; i < end; i++) {
                      if (!selectedRows.has(i)) return false;
                    }
                    return true;
                  })()}
                  onCheckedChange={handleSelectAll}
                />
              </TableHead>
              {displayedColumns.map((column) => (
                <TableHead
                  key={column}
                  className="whitespace-nowrap"
                  aria-sort={
                    sortColumn === column
                      ? (sortDirection === 'asc' ? 'ascending' : 'descending')
                      : 'none'
                  }
                >
                  <Button
                    variant="ghost"
                    size="sm"
                    className="-ml-3 h-8 data-[state=open]:bg-accent"
                    onClick={() => handleSort(column)}
                  >
                    {getColumnLabel(column)}
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                  </Button>
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody style={paginatedProcesses.length > 50 ? { position: 'relative' } : undefined}>
            {paginatedProcesses.length === 0 ? (
              <TableRow>
                <TableCell colSpan={displayedColumns.length + 1} className="text-center h-24">
                  <p className="text-muted-foreground">Nenhum resultado encontrado.</p>
                </TableCell>
              </TableRow>
            ) : paginatedProcesses.length > 50 ? (
              // Virtualização ativada para >50 linhas
              <>
                {/* Spacer para altura total */}
                <TableRow>
                  <TableCell
                    colSpan={displayedColumns.length + 1}
                    style={{
                      height: `${rowVirtualizer.getTotalSize()}px`,
                      padding: 0,
                      border: 'none'
                    }}
                  />
                </TableRow>

                {/* Renderizar apenas linhas virtualizadas */}
                {rowVirtualizer.getVirtualItems().map((virtualRow) => {
                  const process = paginatedProcesses[virtualRow.index];
                  const globalIndex = (currentPage - 1) * pageSize + virtualRow.index;

                  return (
                    <TableRow
                      key={globalIndex}
                      className="hover:bg-muted-emphasis"
                      style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        transform: `translateY(${virtualRow.start}px)`,
                      }}
                    >
                      <TableCell>
                        <Checkbox
                          checked={selectedRows.has(globalIndex)}
                          onCheckedChange={() => handleRowSelect(globalIndex)}
                        />
                      </TableCell>
                      {displayedColumns.map((column) => {
                        const cellValue = formatCellValue(process[column]);
                        return (
                          <TableCell key={column} className="min-w-[100px] max-w-[300px] truncate text-foreground">
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <span className="truncate block">{cellValue}</span>
                              </TooltipTrigger>
                              <TooltipContent side="top" className="max-w-md">
                                <p className="break-words">{cellValue}</p>
                              </TooltipContent>
                            </Tooltip>
                          </TableCell>
                        );
                      })}
                    </TableRow>
                  );
                })}
              </>
            ) : (
              // Renderização normal para ≤50 linhas
              paginatedProcesses.map((process, index) => {
                const globalIndex = (currentPage - 1) * pageSize + index;
                return (
                  <TableRow key={globalIndex} className="hover:bg-muted-emphasis">
                    <TableCell>
                      <Checkbox
                        checked={selectedRows.has(globalIndex)}
                        onCheckedChange={() => handleRowSelect(globalIndex)}
                      />
                    </TableCell>
                    {displayedColumns.map((column) => {
                      const cellValue = formatCellValue(process[column]);
                      return (
                        <TableCell key={column} className="min-w-[100px] max-w-[300px] truncate text-foreground">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span className="truncate block">{cellValue}</span>
                            </TooltipTrigger>
                            <TooltipContent side="top" className="max-w-md">
                              <p className="break-words">{cellValue}</p>
                            </TooltipContent>
                          </Tooltip>
                        </TableCell>
                      );
                    })}
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <div
          className="text-sm text-muted-foreground font-medium"
          aria-live="polite"
          aria-atomic="true"
        >
          Mostrando {startIndex} a {endIndex} de {sortedProcesses.length} processo{sortedProcesses.length !== 1 ? 's' : ''}
          {searchTerm && ` (filtrado de ${allProcesses.length} total)`}
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(1)}
            disabled={currentPage === 1}
            aria-label="Ir para primeira página"
          >
            <ChevronsLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(currentPage - 1)}
            disabled={currentPage === 1}
            aria-label="Página anterior"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm px-2">
            Página {currentPage} de {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(currentPage + 1)}
            disabled={currentPage === totalPages}
            aria-label="Próxima página"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(totalPages)}
            disabled={currentPage === totalPages}
            aria-label="Ir para última página"
          >
            <ChevronsRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
      </div>
    </TooltipProvider>
  );
}

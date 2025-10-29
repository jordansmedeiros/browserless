/**
 * Results Table View Component
 * Displays scraped processes in a sortable, filterable table
 */

'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
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
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ArrowUpDown,
  Search,
  X,
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

    // Prioritize common columns
    const priorityColumns = ['numeroProcesso', 'polo', 'natureza', 'assunto', 'movimentacao'];
    const otherColumns = Array.from(columnsSet).filter((col) => !priorityColumns.includes(col));

    return [...priorityColumns.filter((col) => columnsSet.has(col)), ...otherColumns];
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
    };
    return labels[column] || column;
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
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
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
          <span className="text-sm text-muted-foreground whitespace-nowrap">Linhas por página:</span>
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
        </div>
      </div>

      {/* Table */}
      <div
        ref={tableContainerRef}
        className="rounded-md border overflow-auto"
        style={{ height: paginatedProcesses.length > 50 ? '600px' : 'auto' }}
      >
        <Table>
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
              {columns.map((column) => (
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
                <TableCell colSpan={columns.length + 1} className="text-center h-24">
                  <p className="text-muted-foreground">Nenhum resultado encontrado.</p>
                </TableCell>
              </TableRow>
            ) : paginatedProcesses.length > 50 ? (
              // Virtualização ativada para >50 linhas
              <>
                {/* Spacer para altura total */}
                <TableRow>
                  <TableCell
                    colSpan={columns.length + 1}
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
                      {columns.map((column) => (
                        <TableCell key={column} className="max-w-md truncate">
                          {formatCellValue(process[column])}
                        </TableCell>
                      ))}
                    </TableRow>
                  );
                })}
              </>
            ) : (
              // Renderização normal para ≤50 linhas
              paginatedProcesses.map((process, index) => {
                const globalIndex = (currentPage - 1) * pageSize + index;
                return (
                  <TableRow key={globalIndex}>
                    <TableCell>
                      <Checkbox
                        checked={selectedRows.has(globalIndex)}
                        onCheckedChange={() => handleRowSelect(globalIndex)}
                      />
                    </TableCell>
                    {columns.map((column) => (
                      <TableCell key={column} className="max-w-md truncate">
                        {formatCellValue(process[column])}
                      </TableCell>
                    ))}
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
          className="text-sm text-muted-foreground"
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
  );
}

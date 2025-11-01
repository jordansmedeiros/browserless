---
name: data-table-dashboard
description: Expert in building enterprise-grade data tables with TanStack Table, shadcn/ui integration, Recharts visualization, and interactive dashboards with advanced filtering, sorting, and CRUD operations.
---

# Data Table + Dashboard Master

You are a Senior Data Visualization Engineer and expert in building enterprise-grade data tables and interactive dashboards. You specialize in TanStack Table integration with shadcn/ui, Recharts for data visualization, and creating performant, accessible data interfaces for complex applications.

## Core Responsibilities

* Follow user requirements precisely and to the letter
* Think step-by-step: describe your data architecture plan in detailed pseudocode first
* Confirm approach, then write complete, working data table/dashboard code
* Write correct, best practice, performant, type-safe data handling code
* Prioritize accessibility, performance optimization, and user experience
* Implement all requested functionality completely
* Leave NO todos, placeholders, or missing pieces
* Include all required imports, types, and proper data exports
* Be concise and minimize unnecessary prose

## Technology Stack Focus

* **TanStack Table v8**: Headless table library with advanced features
* **shadcn/ui**: Table, Chart, and UI component integration
* **Recharts**: Data visualization and chart components
* **TypeScript**: Strict typing for data models and table configurations
* **React Hook Form + Zod**: Form handling and validation for data operations
* **TanStack Query**: Server state management and data fetching
* **TanStack Virtual**: Virtual scrolling for large datasets

## Data Table Architecture

### Basic TanStack Table Setup

```typescript
// lib/types/processo.ts
export interface Processo {
  id: string;
  numero: string;
  classe: string;
  assunto: string;
  status: 'ATIVO' | 'ARQUIVADO' | 'SUSPENSO';
  tribunal: {
    id: string;
    nome: string;
    codigo: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

// components/processos/columns.tsx
import { ColumnDef } from '@tanstack/react-table';
import { Processo } from '@/lib/types/processo';
import { Checkbox } from '@/components/ui/checkbox';
import { DataTableColumnHeader } from '@/components/ui/data-table-column-header';
import { Badge } from '@/components/ui/badge';
import { ProcessoRowActions } from './processo-row-actions';

export const processoColumns: ColumnDef<Processo>[] = [
  // Selection column
  {
    id: 'select',
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && 'indeterminate')
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Selecionar todos"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Selecionar linha"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },

  // Data columns
  {
    accessorKey: 'numero',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Número" />
    ),
    cell: ({ row }) => (
      <div className="font-mono text-sm">{row.getValue('numero')}</div>
    ),
  },
  {
    accessorKey: 'classe',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Classe" />
    ),
  },
  {
    accessorKey: 'assunto',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Assunto" />
    ),
    cell: ({ row }) => (
      <div className="max-w-[500px] truncate">
        {row.getValue('assunto')}
      </div>
    ),
  },
  {
    accessorKey: 'status',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Status" />
    ),
    cell: ({ row }) => {
      const status = row.getValue('status') as string;
      return (
        <Badge
          variant={
            status === 'ATIVO'
              ? 'default'
              : status === 'ARQUIVADO'
              ? 'secondary'
              : 'destructive'
          }
        >
          {status}
        </Badge>
      );
    },
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id));
    },
  },
  {
    accessorKey: 'tribunal.nome',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Tribunal" />
    ),
    cell: ({ row }) => row.original.tribunal.nome,
  },
  {
    accessorKey: 'createdAt',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Criado em" />
    ),
    cell: ({ row }) => {
      const date = row.getValue('createdAt') as Date;
      return new Intl.DateTimeFormat('pt-BR').format(date);
    },
  },

  // Actions column
  {
    id: 'actions',
    cell: ({ row }) => <ProcessoRowActions row={row} />,
  },
];
```

### DataTable Component with Full Features

```typescript
// components/ui/data-table.tsx
'use client';

import * as React from 'react';
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { DataTablePagination } from '@/components/ui/data-table-pagination';
import { DataTableToolbar } from '@/components/ui/data-table-toolbar';

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  searchKey?: string;
  filterableColumns?: {
    id: string;
    title: string;
    options: { label: string; value: string }[];
  }[];
}

export function DataTable<TData, TValue>({
  columns,
  data,
  searchKey,
  filterableColumns = [],
}: DataTableProps<TData, TValue>) {
  const [rowSelection, setRowSelection] = React.useState({});
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [sorting, setSorting] = React.useState<SortingState>([]);

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      columnVisibility,
      rowSelection,
      columnFilters,
    },
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
  });

  return (
    <div className="space-y-4">
      <DataTableToolbar
        table={table}
        searchKey={searchKey}
        filterableColumns={filterableColumns}
      />
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && 'selected'}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  Nenhum resultado encontrado.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <DataTablePagination table={table} />
    </div>
  );
}
```

### DataTable Column Header with Sorting

```typescript
// components/ui/data-table-column-header.tsx
'use client';

import { Column } from '@tanstack/react-table';
import { ArrowDown, ArrowUp, ChevronsUpDown, EyeOff } from 'lucide-react';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface DataTableColumnHeaderProps<TData, TValue>
  extends React.HTMLAttributes<HTMLDivElement> {
  column: Column<TData, TValue>;
  title: string;
}

export function DataTableColumnHeader<TData, TValue>({
  column,
  title,
  className,
}: DataTableColumnHeaderProps<TData, TValue>) {
  if (!column.getCanSort()) {
    return <div className={cn(className)}>{title}</div>;
  }

  return (
    <div className={cn('flex items-center space-x-2', className)}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="-ml-3 h-8 data-[state=open]:bg-accent"
          >
            <span>{title}</span>
            {column.getIsSorted() === 'desc' ? (
              <ArrowDown className="ml-2 h-4 w-4" />
            ) : column.getIsSorted() === 'asc' ? (
              <ArrowUp className="ml-2 h-4 w-4" />
            ) : (
              <ChevronsUpDown className="ml-2 h-4 w-4" />
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          <DropdownMenuItem onClick={() => column.toggleSorting(false)}>
            <ArrowUp className="mr-2 h-3.5 w-3.5 text-muted-foreground/70" />
            Crescente
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => column.toggleSorting(true)}>
            <ArrowDown className="mr-2 h-3.5 w-3.5 text-muted-foreground/70" />
            Decrescente
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => column.toggleVisibility(false)}>
            <EyeOff className="mr-2 h-3.5 w-3.5 text-muted-foreground/70" />
            Ocultar
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
```

### DataTable Toolbar with Search and Filters

```typescript
// components/ui/data-table-toolbar.tsx
'use client';

import { Table } from '@tanstack/react-table';
import { X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DataTableViewOptions } from '@/components/ui/data-table-view-options';
import { DataTableFacetedFilter } from '@/components/ui/data-table-faceted-filter';

interface DataTableToolbarProps<TData> {
  table: Table<TData>;
  searchKey?: string;
  filterableColumns?: {
    id: string;
    title: string;
    options: { label: string; value: string }[];
  }[];
}

export function DataTableToolbar<TData>({
  table,
  searchKey,
  filterableColumns = [],
}: DataTableToolbarProps<TData>) {
  const isFiltered = table.getState().columnFilters.length > 0;

  return (
    <div className="flex items-center justify-between">
      <div className="flex flex-1 items-center space-x-2">
        {searchKey && (
          <Input
            placeholder={`Buscar por ${searchKey}...`}
            value={(table.getColumn(searchKey)?.getFilterValue() as string) ?? ''}
            onChange={(event) =>
              table.getColumn(searchKey)?.setFilterValue(event.target.value)
            }
            className="h-8 w-[150px] lg:w-[250px]"
          />
        )}

        {filterableColumns.map((column) =>
          table.getColumn(column.id) ? (
            <DataTableFacetedFilter
              key={column.id}
              column={table.getColumn(column.id)}
              title={column.title}
              options={column.options}
            />
          ) : null
        )}

        {isFiltered && (
          <Button
            variant="ghost"
            onClick={() => table.resetColumnFilters()}
            className="h-8 px-2 lg:px-3"
          >
            Limpar
            <X className="ml-2 h-4 w-4" />
          </Button>
        )}
      </div>
      <DataTableViewOptions table={table} />
    </div>
  );
}
```

### DataTable Faceted Filter

```typescript
// components/ui/data-table-faceted-filter.tsx
'use client';

import * as React from 'react';
import { Column } from '@tanstack/react-table';
import { Check, PlusCircle } from 'lucide-react';

import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Separator } from '@/components/ui/separator';

interface DataTableFacetedFilterProps<TData, TValue> {
  column?: Column<TData, TValue>;
  title?: string;
  options: {
    label: string;
    value: string;
    icon?: React.ComponentType<{ className?: string }>;
  }[];
}

export function DataTableFacetedFilter<TData, TValue>({
  column,
  title,
  options,
}: DataTableFacetedFilterProps<TData, TValue>) {
  const facets = column?.getFacetedUniqueValues();
  const selectedValues = new Set(column?.getFilterValue() as string[]);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="h-8 border-dashed">
          <PlusCircle className="mr-2 h-4 w-4" />
          {title}
          {selectedValues?.size > 0 && (
            <>
              <Separator orientation="vertical" className="mx-2 h-4" />
              <Badge
                variant="secondary"
                className="rounded-sm px-1 font-normal lg:hidden"
              >
                {selectedValues.size}
              </Badge>
              <div className="hidden space-x-1 lg:flex">
                {selectedValues.size > 2 ? (
                  <Badge
                    variant="secondary"
                    className="rounded-sm px-1 font-normal"
                  >
                    {selectedValues.size} selecionados
                  </Badge>
                ) : (
                  options
                    .filter((option) => selectedValues.has(option.value))
                    .map((option) => (
                      <Badge
                        variant="secondary"
                        key={option.value}
                        className="rounded-sm px-1 font-normal"
                      >
                        {option.label}
                      </Badge>
                    ))
                )}
              </div>
            </>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[200px] p-0" align="start">
        <Command>
          <CommandInput placeholder={title} />
          <CommandList>
            <CommandEmpty>Nenhum resultado encontrado.</CommandEmpty>
            <CommandGroup>
              {options.map((option) => {
                const isSelected = selectedValues.has(option.value);
                return (
                  <CommandItem
                    key={option.value}
                    onSelect={() => {
                      if (isSelected) {
                        selectedValues.delete(option.value);
                      } else {
                        selectedValues.add(option.value);
                      }
                      const filterValues = Array.from(selectedValues);
                      column?.setFilterValue(
                        filterValues.length ? filterValues : undefined
                      );
                    }}
                  >
                    <div
                      className={cn(
                        'mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary',
                        isSelected
                          ? 'bg-primary text-primary-foreground'
                          : 'opacity-50 [&_svg]:invisible'
                      )}
                    >
                      <Check className={cn('h-4 w-4')} />
                    </div>
                    {option.icon && (
                      <option.icon className="mr-2 h-4 w-4 text-muted-foreground" />
                    )}
                    <span>{option.label}</span>
                    {facets?.get(option.value) && (
                      <span className="ml-auto flex h-4 w-4 items-center justify-center font-mono text-xs">
                        {facets.get(option.value)}
                      </span>
                    )}
                  </CommandItem>
                );
              })}
            </CommandGroup>
            {selectedValues.size > 0 && (
              <>
                <CommandSeparator />
                <CommandGroup>
                  <CommandItem
                    onSelect={() => column?.setFilterValue(undefined)}
                    className="justify-center text-center"
                  >
                    Limpar filtros
                  </CommandItem>
                </CommandGroup>
              </>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
```

### DataTable Pagination

```typescript
// components/ui/data-table-pagination.tsx
'use client';

import { Table } from '@tanstack/react-table';
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface DataTablePaginationProps<TData> {
  table: Table<TData>;
}

export function DataTablePagination<TData>({
  table,
}: DataTablePaginationProps<TData>) {
  return (
    <div className="flex items-center justify-between px-2">
      <div className="flex-1 text-sm text-muted-foreground">
        {table.getFilteredSelectedRowModel().rows.length} de{' '}
        {table.getFilteredRowModel().rows.length} linha(s) selecionada(s).
      </div>
      <div className="flex items-center space-x-6 lg:space-x-8">
        <div className="flex items-center space-x-2">
          <p className="text-sm font-medium">Linhas por página</p>
          <Select
            value={`${table.getState().pagination.pageSize}`}
            onValueChange={(value) => {
              table.setPageSize(Number(value));
            }}
          >
            <SelectTrigger className="h-8 w-[70px]">
              <SelectValue placeholder={table.getState().pagination.pageSize} />
            </SelectTrigger>
            <SelectContent side="top">
              {[10, 20, 30, 40, 50].map((pageSize) => (
                <SelectItem key={pageSize} value={`${pageSize}`}>
                  {pageSize}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex w-[100px] items-center justify-center text-sm font-medium">
          Página {table.getState().pagination.pageIndex + 1} de{' '}
          {table.getPageCount()}
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            className="hidden h-8 w-8 p-0 lg:flex"
            onClick={() => table.setPageIndex(0)}
            disabled={!table.getCanPreviousPage()}
          >
            <span className="sr-only">Ir para primeira página</span>
            <ChevronsLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            className="h-8 w-8 p-0"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            <span className="sr-only">Ir para página anterior</span>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            className="h-8 w-8 p-0"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            <span className="sr-only">Ir para próxima página</span>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            className="hidden h-8 w-8 p-0 lg:flex"
            onClick={() => table.setPageIndex(table.getPageCount() - 1)}
            disabled={!table.getCanNextPage()}
          >
            <span className="sr-only">Ir para última página</span>
            <ChevronsRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
```

### Row Actions with Dropdown Menu

```typescript
// components/processos/processo-row-actions.tsx
'use client';

import { Row } from '@tanstack/react-table';
import { MoreHorizontal, Pencil, Trash } from 'lucide-react';
import { useTransition } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { deleteProcesso } from '@/app/actions/processos';
import { Processo } from '@/lib/types/processo';

interface ProcessoRowActionsProps {
  row: Row<Processo>;
}

export function ProcessoRowActions({ row }: ProcessoRowActionsProps) {
  const [isPending, startTransition] = useTransition();
  const processo = row.original;

  const handleDelete = () => {
    if (!confirm('Tem certeza que deseja deletar este processo?')) return;

    startTransition(async () => {
      try {
        await deleteProcesso(processo.id);
        toast.success('Processo deletado com sucesso');
      } catch (error) {
        toast.error('Erro ao deletar processo');
      }
    });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="flex h-8 w-8 p-0 data-[state=open]:bg-muted"
        >
          <MoreHorizontal className="h-4 w-4" />
          <span className="sr-only">Abrir menu</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[160px]">
        <DropdownMenuItem>
          <Pencil className="mr-2 h-3.5 w-3.5 text-muted-foreground/70" />
          Editar
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={handleDelete}
          disabled={isPending}
          className="text-red-600"
        >
          <Trash className="mr-2 h-3.5 w-3.5" />
          Deletar
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
```

## Server-Side Data Table

### With TanStack Query

```typescript
// app/(dashboard)/processos/page.tsx
'use client';

import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { DataTable } from '@/components/ui/data-table';
import { processoColumns } from '@/components/processos/columns';
import { Processo } from '@/lib/types/processo';

interface ProcessosPageProps {
  searchParams: {
    page?: string;
    pageSize?: string;
    sort?: string;
    status?: string;
  };
}

export default function ProcessosPage({ searchParams }: ProcessosPageProps) {
  const page = Number(searchParams.page) || 1;
  const pageSize = Number(searchParams.pageSize) || 10;
  const sort = searchParams.sort || 'createdAt_desc';
  const status = searchParams.status;

  const { data, isLoading, error } = useQuery({
    queryKey: ['processos', { page, pageSize, sort, status }],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: String(page),
        pageSize: String(pageSize),
        sort,
        ...(status && { status }),
      });

      const res = await fetch(`/api/processos?${params}`);
      if (!res.ok) throw new Error('Failed to fetch');
      return res.json() as Promise<{
        data: Processo[];
        pageCount: number;
        total: number;
      }>;
    },
  });

  if (isLoading) {
    return <div>Carregando...</div>;
  }

  if (error) {
    return <div>Erro ao carregar processos</div>;
  }

  return (
    <div className="container py-10">
      <h1 className="mb-8 text-3xl font-bold">Processos</h1>
      <DataTable
        columns={processoColumns}
        data={data?.data || []}
        searchKey="numero"
        filterableColumns={[
          {
            id: 'status',
            title: 'Status',
            options: [
              { label: 'Ativo', value: 'ATIVO' },
              { label: 'Arquivado', value: 'ARQUIVADO' },
              { label: 'Suspenso', value: 'SUSPENSO' },
            ],
          },
        ]}
      />
    </div>
  );
}
```

## Dashboard with Charts (Recharts)

### Chart Component with shadcn/ui

```typescript
// components/dashboard/processos-chart.tsx
'use client';

import { TrendingUp } from 'lucide-react';
import { Bar, BarChart, CartesianGrid, XAxis } from 'recharts';

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';

const chartData = [
  { month: 'Janeiro', total: 186 },
  { month: 'Fevereiro', total: 305 },
  { month: 'Março', total: 237 },
  { month: 'Abril', total: 73 },
  { month: 'Maio', total: 209 },
  { month: 'Junho', total: 214 },
];

const chartConfig = {
  total: {
    label: 'Total',
    color: 'hsl(var(--chart-1))',
  },
} satisfies ChartConfig;

export function ProcessosChart() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Processos por Mês</CardTitle>
        <CardDescription>Janeiro - Junho 2024</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig}>
          <BarChart accessibilityLayer data={chartData}>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="month"
              tickLine={false}
              tickMargin={10}
              axisLine={false}
              tickFormatter={(value) => value.slice(0, 3)}
            />
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent hideLabel />}
            />
            <Bar dataKey="total" fill="var(--color-total)" radius={8} />
          </BarChart>
        </ChartContainer>
      </CardContent>
      <CardFooter className="flex-col items-start gap-2 text-sm">
        <div className="flex gap-2 font-medium leading-none">
          Tendência de alta de 5.2% este mês{' '}
          <TrendingUp className="h-4 w-4" />
        </div>
        <div className="leading-none text-muted-foreground">
          Mostrando total de processos dos últimos 6 meses
        </div>
      </CardFooter>
    </Card>
  );
}
```

### Interactive Dashboard with Filters

```typescript
// app/(dashboard)/page.tsx
'use client';

import { useState } from 'react';
import { ProcessosChart } from '@/components/dashboard/processos-chart';
import { ProcessosTable } from '@/components/dashboard/processos-table';
import { DashboardFilters } from '@/components/dashboard/filters';

export default function DashboardPage() {
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date }>();
  const [tribunalId, setTribunalId] = useState<string>();

  return (
    <div className="container py-10">
      <h1 className="mb-8 text-3xl font-bold">Dashboard</h1>

      <DashboardFilters
        onDateRangeChange={setDateRange}
        onTribunalChange={setTribunalId}
      />

      <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <ProcessosChart dateRange={dateRange} tribunalId={tribunalId} />
        {/* Add more charts */}
      </div>

      <div className="mt-8">
        <ProcessosTable dateRange={dateRange} tribunalId={tribunalId} />
      </div>
    </div>
  );
}
```

## Performance Optimization

### Virtual Scrolling for Large Datasets

```typescript
// components/ui/data-table-virtualized.tsx
'use client';

import { useVirtualizer } from '@tanstack/react-virtual';
import { useRef } from 'react';
import { Table } from '@tanstack/react-table';

interface DataTableVirtualizedProps<TData> {
  table: Table<TData>;
}

export function DataTableVirtualized<TData>({
  table,
}: DataTableVirtualizedProps<TData>) {
  const tableContainerRef = useRef<HTMLDivElement>(null);

  const { rows } = table.getRowModel();

  const rowVirtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => tableContainerRef.current,
    estimateSize: () => 50,
    overscan: 10,
  });

  return (
    <div
      ref={tableContainerRef}
      className="h-[600px] overflow-auto rounded-md border"
    >
      <div style={{ height: `${rowVirtualizer.getTotalSize()}px` }}>
        <table className="w-full">
          <thead className="sticky top-0 bg-background">
            {/* Header rows */}
          </thead>
          <tbody>
            {rowVirtualizer.getVirtualItems().map((virtualRow) => {
              const row = rows[virtualRow.index];
              return (
                <tr
                  key={row.id}
                  style={{
                    height: `${virtualRow.size}px`,
                    transform: `translateY(${virtualRow.start}px)`,
                  }}
                >
                  {/* Row cells */}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
```

## Response Protocol

1. **If uncertain about performance implications for large datasets, state so explicitly**
2. **If you don't know a specific TanStack Table API, admit it rather than guessing**
3. **Search for latest TanStack Table and Recharts documentation when needed**
4. **Provide usage examples only when requested**
5. **Stay focused on data table and dashboard implementation over general advice**

## When to Use This Skill

Use this skill when:
- Building data tables with TanStack Table
- Creating dashboards with charts and tables
- Implementing advanced filtering and sorting
- Adding CRUD operations to tables
- Integrating Recharts visualizations
- Optimizing table performance for large datasets
- Building enterprise-grade data interfaces
- Creating accessible data tables

## Related Documentation

- [TanStack Table v8 Documentation](https://tanstack.com/table/v8)
- [TanStack Query Documentation](https://tanstack.com/query/latest)
- [TanStack Virtual Documentation](https://tanstack.com/virtual/latest)
- [Recharts Documentation](https://recharts.org)
- [shadcn/ui Table Components](https://ui.shadcn.com/docs/components/table)
- [shadcn/ui Chart Components](https://ui.shadcn.com/docs/components/chart)
- Project patterns: `.claude/skills/jusbro-patterns/SKILL.md`
- Next.js patterns: `.claude/skills/nextjs-16-expert/SKILL.md`

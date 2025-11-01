'use client';

/**
 * Dashboard Charts Components
 * Componentes de gráficos usando Recharts
 */

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LegendProps,
  TooltipProps,
} from 'recharts';
import type { DashboardChartsData } from '@/lib/types/dashboard';

interface ChartWrapperProps {
  title: string;
  description?: string;
  loading?: boolean;
  children: React.ReactNode;
}

/**
 * Wrapper para gráficos com card
 */
function ChartWrapper({ title, description, loading, children }: ChartWrapperProps) {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          {description && <CardDescription>{description}</CardDescription>}
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[300px] w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

/**
 * Cores para os gráficos
 */
const CHART_COLORS = [
  'hsl(var(--chart-1))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))',
  'hsl(var(--primary))',
  'hsl(var(--secondary))',
];

/**
 * Tooltip customizado
 */
function CustomTooltip({ active, payload, label }: TooltipProps<any, any>) {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-lg border bg-background p-3 shadow-sm">
        <p className="text-sm font-medium">{label}</p>
        {payload.map((entry, index) => (
          <p key={index} className="text-sm" style={{ color: entry.color }}>
            {entry.name}: <span className="font-medium">{entry.value}</span>
          </p>
        ))}
      </div>
    );
  }
  return null;
}

/**
 * Legend customizado
 */
function CustomLegend({ payload }: LegendProps) {
  return (
    <div className="flex items-center justify-center gap-6 mt-4">
      {payload?.map((entry, index) => (
        <div key={index} className="flex items-center gap-2">
          <div
            className="h-3 w-3 rounded-full"
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-sm text-muted-foreground">{entry.value}</span>
        </div>
      ))}
    </div>
  );
}

/**
 * Processos por Tribunal Chart
 * Gráfico de barras mostrando top 10 tribunais
 */
export function ProcessosPorTribunalChart({
  data,
  loading,
}: {
  data?: DashboardChartsData['processosPorTribunal'];
  loading?: boolean;
}) {
  if (!data || data.length === 0) {
    return (
      <ChartWrapper
        title="Processos por Tribunal"
        description="Top 10 tribunais com mais processos"
        loading={loading}
      >
        <div className="flex items-center justify-center h-[300px] text-muted-foreground">
          Nenhum dado disponível
        </div>
      </ChartWrapper>
    );
  }

  return (
    <ChartWrapper
      title="Processos por Tribunal"
      description="Top 10 tribunais com mais processos"
      loading={loading}
    >
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data} layout="vertical" margin={{ left: 80, right: 20 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis type="number" />
          <YAxis dataKey="nome" type="category" width={70} />
          <Tooltip content={<CustomTooltip />} />
          <Bar dataKey="valor" fill="hsl(var(--primary))" radius={[0, 8, 8, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </ChartWrapper>
  );
}

/**
 * Processos por Tipo Chart
 * Gráfico de pizza mostrando distribuição por tipo
 */
export function ProcessosPorTipoChart({
  data,
  loading,
}: {
  data?: DashboardChartsData['processosPorTipo'];
  loading?: boolean;
}) {
  if (!data || data.length === 0) {
    return (
      <ChartWrapper
        title="Processos por Tipo"
        description="Distribuição de processos por tipo de raspagem"
        loading={loading}
      >
        <div className="flex items-center justify-center h-[300px] text-muted-foreground">
          Nenhum dado disponível
        </div>
      </ChartWrapper>
    );
  }

  return (
    <ChartWrapper
      title="Processos por Tipo"
      description="Distribuição de processos por tipo de raspagem"
      loading={loading}
    >
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={(entry) => `${entry.nome}: ${entry.valor}`}
            outerRadius={100}
            fill="#8884d8"
            dataKey="valor"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
        </PieChart>
      </ResponsiveContainer>
    </ChartWrapper>
  );
}

/**
 * Raspagens por Status Chart
 * Gráfico de barras mostrando status de raspagens
 */
export function RaspagensPorStatusChart({
  data,
  loading,
}: {
  data?: DashboardChartsData['raspagensPorStatus'];
  loading?: boolean;
}) {
  if (!data || data.length === 0) {
    return (
      <ChartWrapper
        title="Raspagens por Status"
        description="Status das raspagens nos últimos 7 dias"
        loading={loading}
      >
        <div className="flex items-center justify-center h-[300px] text-muted-foreground">
          Nenhum dado disponível
        </div>
      </ChartWrapper>
    );
  }

  return (
    <ChartWrapper
      title="Raspagens por Status"
      description="Status das raspagens nos últimos 7 dias"
      loading={loading}
    >
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="nome" />
          <YAxis />
          <Tooltip content={<CustomTooltip />} />
          <Bar dataKey="valor" fill="hsl(var(--primary))" radius={[8, 8, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </ChartWrapper>
  );
}

/**
 * Tendência de Processos Chart
 * Gráfico de linha mostrando evolução temporal
 */
export function TendenciaProcessosChart({
  data,
  loading,
}: {
  data?: DashboardChartsData['tendenciaProcessos'];
  loading?: boolean;
}) {
  if (!data || data.length === 0) {
    return (
      <ChartWrapper
        title="Tendência de Processos"
        description="Evolução de processos nos últimos 7 dias"
        loading={loading}
      >
        <div className="flex items-center justify-center h-[300px] text-muted-foreground">
          Nenhum dado disponível
        </div>
      </ChartWrapper>
    );
  }

  return (
    <ChartWrapper
      title="Tendência de Processos"
      description="Evolução de processos nos últimos 7 dias"
      loading={loading}
    >
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="data"
            tickFormatter={(value) => {
              const date = new Date(value);
              return `${date.getDate()}/${date.getMonth() + 1}`;
            }}
          />
          <YAxis />
          <Tooltip
            content={<CustomTooltip />}
            labelFormatter={(value) => {
              const date = new Date(value);
              return date.toLocaleDateString('pt-BR');
            }}
          />
          <Legend content={<CustomLegend />} />
          <Line
            type="monotone"
            dataKey="total"
            stroke="hsl(var(--chart-1))"
            strokeWidth={2}
            dot={{ r: 4 }}
            name="Total"
          />
          <Line
            type="monotone"
            dataKey="novos"
            stroke="hsl(var(--chart-2))"
            strokeWidth={2}
            dot={{ r: 4 }}
            name="Novos"
          />
        </LineChart>
      </ResponsiveContainer>
    </ChartWrapper>
  );
}

/**
 * Performance por Tribunal Chart
 * Gráfico de barras mostrando performance
 */
export function PerformanceTribunaisChart({
  data,
  loading,
}: {
  data?: DashboardChartsData['performanceTribunais'];
  loading?: boolean;
}) {
  if (!data || data.length === 0) {
    return (
      <ChartWrapper
        title="Performance por Tribunal"
        description="Métricas de performance dos tribunais"
        loading={loading}
      >
        <div className="flex items-center justify-center h-[300px] text-muted-foreground">
          Nenhum dado disponível
        </div>
      </ChartWrapper>
    );
  }

  return (
    <ChartWrapper
      title="Performance por Tribunal"
      description="Métricas de performance dos tribunais"
      loading={loading}
    >
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="tribunal" />
          <YAxis />
          <Tooltip content={<CustomTooltip />} />
          <Legend content={<CustomLegend />} />
          <Bar dataKey="sucessos" fill="hsl(var(--chart-1))" radius={[8, 8, 0, 0]} name="Sucessos" />
          <Bar dataKey="falhas" fill="hsl(var(--destructive))" radius={[8, 8, 0, 0]} name="Falhas" />
        </BarChart>
      </ResponsiveContainer>
    </ChartWrapper>
  );
}


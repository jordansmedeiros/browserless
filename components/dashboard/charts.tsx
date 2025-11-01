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
  '#3b82f6', // blue
  '#10b981', // emerald
  '#f59e0b', // amber
  '#ef4444', // red
  '#8b5cf6', // violet
  '#06b6d4', // cyan
  '#ec4899', // pink
  '#f97316', // orange
  '#14b8a6', // teal
  '#6366f1', // indigo
];

/**
 * Normalizar nome de tribunal para exibição
 * Converte nomes longos em versões curtas
 */
function normalizeTribunalName(name: string): string {
  // TRT da N Região -> TRTN
  const trtMatch = name.match(/TRT da (\d+)[aª]? Região/i);
  if (trtMatch) {
    return `TRT${trtMatch[1]}`;
  }

  // Justiça de [Estado] ou Justiça do Estado de [Estado] -> TJ[SIGLA]
  const tjMatch = name.match(/Justiça (?:do|de) (?:Estado de )?([A-Za-z]+(?:\s+[A-Za-z]+)*)/i);
  if (tjMatch) {
    const estado = tjMatch[1];
    // Mapear estados comuns
    const siglas: Record<string, string> = {
      'Minas Gerais': 'MG',
      'São Paulo': 'SP',
      'Rio de Janeiro': 'RJ',
      'Rio Grande do Sul': 'RS',
      'Bahia': 'BA',
      'Paraná': 'PR',
      'Parana': 'PR',
      'Santa Catarina': 'SC',
      'Goiás': 'GO',
      'Goias': 'GO',
      'Pernambuco': 'PE',
      'Ceará': 'CE',
      'Ceara': 'CE',
      'Paraíba': 'PB',
      'Paraiba': 'PB',
      'Espírito Santo': 'ES',
      'Espirito Santo': 'ES',
      'Maranhão': 'MA',
      'Maranhao': 'MA',
      'Alagoas': 'AL',
      'Sergipe': 'SE',
      'Tocantins': 'TO',
      'Roraima': 'RR',
      'Amapá': 'AP',
      'Amapa': 'AP',
      'Rondônia': 'RO',
      'Rondonia': 'RO',
      'Acre': 'AC',
      'Distrito Federal': 'DF',
    };
    return `TJ${siglas[estado] || estado.substring(0, 2).toUpperCase()}`;
  }

  // TJMG, TJSP, etc. permanecem como estão
  return name;
}

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

  // Normalizar nomes dos tribunais para exibição
  const normalizedData = data.map((item) => ({
    ...item,
    nome: normalizeTribunalName(item.nome),
  }));

  return (
    <ChartWrapper
      title="Processos por Tribunal"
      description="Top 10 tribunais com mais processos"
      loading={loading}
    >
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={normalizedData} layout="vertical" margin={{ left: 60, right: 20 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis type="number" />
          <YAxis dataKey="nome" type="category" width={50} />
          <Tooltip content={<CustomTooltip />} />
          <Bar dataKey="valor" fill={CHART_COLORS[0]} radius={[0, 8, 8, 0]} />
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
            label={(entry) => `${entry.nome}: ${entry.valor.toLocaleString('pt-BR')}`}
            outerRadius={100}
            fill={CHART_COLORS[0]}
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
          <Bar dataKey="valor" fill={CHART_COLORS[0]} radius={[8, 8, 0, 0]} />
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
            stroke={CHART_COLORS[0]}
            strokeWidth={2}
            dot={{ r: 4 }}
            name="Total"
          />
          <Line
            type="monotone"
            dataKey="novos"
            stroke={CHART_COLORS[1]}
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

  // Normalizar nomes dos tribunais
  const normalizedData = data.map((item) => ({
    ...item,
    tribunal: normalizeTribunalName(item.tribunal),
  }));

  return (
    <ChartWrapper
      title="Performance por Tribunal"
      description="Métricas de performance dos tribunais"
      loading={loading}
    >
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={normalizedData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="tribunal" angle={-30} textAnchor="end" height={80} />
          <YAxis />
          <Tooltip content={<CustomTooltip />} />
          <Legend content={<CustomLegend />} />
          <Bar dataKey="tempoMedio" fill={CHART_COLORS[0]} radius={[8, 8, 0, 0]} name="Tempo Médio (s)" />
          <Bar dataKey="sucessos" fill={CHART_COLORS[1]} radius={[8, 8, 0, 0]} name="Sucessos" />
          <Bar dataKey="falhas" fill={CHART_COLORS[2]} radius={[8, 8, 0, 0]} name="Falhas" />
        </BarChart>
      </ResponsiveContainer>
    </ChartWrapper>
  );
}


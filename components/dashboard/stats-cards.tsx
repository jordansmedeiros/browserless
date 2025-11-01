'use client';

/**
 * Stats Cards Component
 * Cards de estatísticas principais do dashboard
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { FileText, List, LogIn, Activity, TrendingUp, Users, Building2 } from 'lucide-react';
import { motion } from 'motion/react';
import type { DashboardStats } from '@/lib/types/dashboard';

interface StatsCardsProps {
  stats: DashboardStats | null;
  loading: boolean;
}

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.3,
    },
  },
};

/**
 * Formatar número para exibição
 */
function formatNumber(value: number): string {
  if (value >= 1000000) {
    return `${(value / 1000000).toFixed(1)}M`;
  }
  if (value >= 1000) {
    return `${(value / 1000).toFixed(1)}K`;
  }
  return value.toLocaleString('pt-BR');
}

/**
 * Componente de skeleton para card
 */
function StatsCardSkeleton() {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <Skeleton className="h-5 w-24" />
        <Skeleton className="h-4 w-4 rounded" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-8 w-20 mb-1" />
        <Skeleton className="h-4 w-40" />
      </CardContent>
    </Card>
  );
}

/**
 * Componente de card de estatística
 */
function StatCard({
  title,
  value,
  description,
  icon: Icon,
  delay = 0,
}: {
  title: string;
  value: string | number;
  description: string;
  icon: React.ElementType;
  delay?: number;
}) {
  const displayValue = typeof value === 'number' ? formatNumber(value) : value;

  return (
    <motion.div
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      transition={{ delay }}
    >
      <Card className="relative overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">{title}</CardTitle>
          <Icon className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{displayValue}</div>
          <p className="text-xs text-muted-foreground">{description}</p>
        </CardContent>
      </Card>
    </motion.div>
  );
}

/**
 * Componente principal de cards de estatísticas
 */
export function StatsCards({ stats, loading }: StatsCardsProps) {
  if (loading) {
    return (
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <StatsCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (!stats) {
    return null;
  }

  const totalJobsAtivos = stats.jobsAtivos.pending + stats.jobsAtivos.running;

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
      <StatCard
        title="Total de Processos"
        value={stats.totalProcessos}
        description="Processos rastreados no sistema"
        icon={FileText}
        delay={0}
      />
      <StatCard
        title="Total de Raspagens"
        value={stats.totalRaspagens}
        description="Raspagens realizadas"
        icon={List}
        delay={0.1}
      />
      <StatCard
        title="Credenciais Ativas"
        value={stats.totalCredenciais}
        description="Credenciais configuradas"
        icon={Users}
        delay={0.2}
      />
      <StatCard
        title="Tribunais Configurados"
        value={stats.totalTribunais}
        description="Tribunais ativos no sistema"
        icon={Building2}
        delay={0.3}
      />
    </div>
  );
}

/**
 * Status Card Component
 * Card mostrando status de jobs ativos
 */
export function StatusCard({ stats, loading }: StatsCardsProps) {
  if (loading) {
    return <StatsCardSkeleton />;
  }

  if (!stats) {
    return null;
  }

  const totalJobsAtivos = stats.jobsAtivos.pending + stats.jobsAtivos.running;
  const hasActiveJobs = totalJobsAtivos > 0;

  return (
    <motion.div variants={cardVariants} initial="hidden" animate="visible">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Jobs Ativos</CardTitle>
          <Activity className={`h-4 w-4 ${hasActiveJobs ? 'text-green-500' : 'text-muted-foreground'}`} />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalJobsAtivos}</div>
          <div className="flex gap-2 mt-2">
            <span className="text-xs text-muted-foreground">
              {stats.jobsAtivos.pending} pendentes
            </span>
            <span className="text-xs text-muted-foreground">•</span>
            <span className="text-xs text-muted-foreground">
              {stats.jobsAtivos.running} em execução
            </span>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

/**
 * Last Activity Card Component
 */
export function LastActivityCard({ stats, loading }: StatsCardsProps) {
  if (loading) {
    return <StatsCardSkeleton />;
  }

  if (!stats) {
    return null;
  }

  const lastActivity = stats.ultimaAtividade;

  if (!lastActivity) {
    return (
      <motion.div variants={cardVariants} initial="hidden" animate="visible">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Última Atividade</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Nenhuma</div>
            <p className="text-xs text-muted-foreground">Nenhuma atividade registrada</p>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  const timeAgo = new Intl.RelativeTimeFormat('pt-BR', { numeric: 'auto' });
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - lastActivity.timestamp.getTime()) / 1000);
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  const diffInHours = Math.floor(diffInMinutes / 60);
  const diffInDays = Math.floor(diffInHours / 24);

  let relativeTime: string;
  if (diffInDays > 0) {
    relativeTime = timeAgo.format(-diffInDays, 'day');
  } else if (diffInHours > 0) {
    relativeTime = timeAgo.format(-diffInHours, 'hour');
  } else if (diffInMinutes > 0) {
    relativeTime = timeAgo.format(-diffInMinutes, 'minute');
  } else {
    relativeTime = 'agora';
  }

  const activityIcon = lastActivity.tipo === 'scrape' ? List : Activity;

  return (
    <motion.div variants={cardVariants} initial="hidden" animate="visible">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Última Atividade</CardTitle>
          <Activity className="h-4 w-4 text-green-500" />
        </CardHeader>
        <CardContent>
          <div className="text-sm font-medium mb-1">{lastActivity.descricao}</div>
          <p className="text-xs text-muted-foreground">{relativeTime}</p>
        </CardContent>
      </Card>
    </motion.div>
  );
}


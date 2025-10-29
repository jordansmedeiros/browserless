import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, LogIn, List, Activity } from 'lucide-react';

export default function DashboardPage() {
  const stats = [
    {
      title: 'Total de Processos',
      value: '0',
      description: 'Processos rastreados',
      icon: FileText,
    },
    {
      title: 'Últimas Raspagens',
      value: '0',
      description: 'Raspagens realizadas',
      icon: List,
    },
    {
      title: 'Status PJE',
      value: 'Desconectado',
      description: 'Faça login para conectar',
      icon: LogIn,
    },
    {
      title: 'Última Atividade',
      value: 'Nunca',
      description: 'Nenhuma atividade registrada',
      icon: Activity,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {stat.title}
                </CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground">
                  {stat.description}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

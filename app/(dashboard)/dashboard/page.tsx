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
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">
          Visão geral do sistema de automação PJE
        </p>
      </div>

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

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Início Rápido</CardTitle>
            <CardDescription>
              Comece a usar o sistema em 3 passos simples
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start gap-4">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
                1
              </div>
              <div>
                <p className="font-medium">Faça login no PJE</p>
                <p className="text-sm text-muted-foreground">
                  Configure suas credenciais e autentique no sistema
                </p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
                2
              </div>
              <div>
                <p className="font-medium">Configure raspagem</p>
                <p className="text-sm text-muted-foreground">
                  Escolha quais processos deseja monitorar
                </p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
                3
              </div>
              <div>
                <p className="font-medium">Visualize resultados</p>
                <p className="text-sm text-muted-foreground">
                  Acesse os dados coletados em tempo real
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recursos Disponíveis</CardTitle>
            <CardDescription>
              Funcionalidades implementadas nesta versão
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-green-500" />
              <span className="text-sm">Login automatizado no PJE</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-green-500" />
              <span className="text-sm">Raspagem de processos</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-green-500" />
              <span className="text-sm">Anti-detecção CloudFront</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-yellow-500" />
              <span className="text-sm">Dashboard em tempo real (em breve)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-yellow-500" />
              <span className="text-sm">Agendamento de tarefas (em breve)</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { List } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function ScrapesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Histórico de Raspagens</h1>
        <p className="text-muted-foreground">
          Acompanhe todas as raspagens realizadas no sistema
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Raspagens Recentes</CardTitle>
          <CardDescription>
            Histórico completo de execuções
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <List className="mb-4 h-12 w-12 text-muted-foreground" />
            <h3 className="mb-2 text-lg font-semibold">Nenhuma raspagem realizada</h3>
            <p className="mb-4 text-sm text-muted-foreground">
              Faça login no PJE e execute sua primeira raspagem
            </p>
            <Button>Iniciar Raspagem</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

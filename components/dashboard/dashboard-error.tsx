'use client';

/**
 * Dashboard Error Component
 * Componente de exibição de erro
 */

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertCircle, RefreshCw } from 'lucide-react';

interface DashboardErrorProps {
  error?: string | null;
  onRetry?: () => void;
}

/**
 * Componente de erro do dashboard
 */
export function DashboardError({ error, onRetry }: DashboardErrorProps) {
  return (
    <Card className="border-destructive">
      <CardContent className="flex flex-col items-center justify-center py-12 px-6">
        <AlertCircle className="h-12 w-12 text-destructive mb-4" />
        <h3 className="text-lg font-semibold mb-2">Erro ao carregar dados</h3>
        <p className="text-sm text-muted-foreground text-center mb-6 max-w-md">
          {error || 'Ocorreu um erro ao carregar os dados do dashboard. Por favor, tente novamente.'}
        </p>
        {onRetry && (
          <Button onClick={onRetry} variant="default">
            <RefreshCw className="h-4 w-4 mr-2" />
            Tentar Novamente
          </Button>
        )}
      </CardContent>
    </Card>
  );
}


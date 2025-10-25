'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Info } from 'lucide-react';

export default function LoginRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    // Redireciona após 2 segundos
    const timer = setTimeout(() => {
      router.push('/pje/credentials');
    }, 2000);

    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Redirecionando...</h1>
        <p className="text-muted-foreground">
          A página de login foi substituída pelo sistema de gerenciamento de credenciais
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="h-5 w-5" />
            Sistema de Credenciais
          </CardTitle>
          <CardDescription>
            Nova forma de gerenciar acesso ao PJE
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertDescription>
              O login interativo foi removido. Agora você deve configurar suas credenciais
              no sistema de gerenciamento, que permite:
            </AlertDescription>
          </Alert>

          <ul className="list-inside list-disc space-y-2 text-sm text-muted-foreground">
            <li>Gerenciar escritórios e advogados</li>
            <li>Cadastrar múltiplas credenciais por advogado</li>
            <li>Associar credenciais a diferentes tribunais</li>
            <li>Testar credenciais antes de usar</li>
            <li>Auto-detecção do ID do advogado no PJE</li>
          </ul>

          <div className="flex items-center justify-center gap-2 pt-4">
            <Loader2 className="h-5 w-5 animate-spin" />
            <p className="text-sm text-muted-foreground">
              Redirecionando para o gerenciamento de credenciais...
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

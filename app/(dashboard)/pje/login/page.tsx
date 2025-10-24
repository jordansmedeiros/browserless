'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, CheckCircle, XCircle, Info } from 'lucide-react';
import { loginPJEAction } from '@/app/actions/pje';
import type { LoginResult } from '@/lib/types';

export default function PJELoginPage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<LoginResult | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setResult(null);

    try {
      const formData = new FormData(event.currentTarget);
      const resultado = await loginPJEAction(formData);
      setResult(resultado);
    } catch (error) {
      setResult({
        success: false,
        message: 'Erro ao processar requisição',
        error: error instanceof Error ? error.message : 'Erro desconhecido',
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Login PJE</h1>
        <p className="text-muted-foreground">
          Autentique-se no sistema PJE TRT3 para iniciar a raspagem
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Credenciais PJE</CardTitle>
          <CardDescription>
            Informe seu CPF e senha cadastrados no PJE
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="cpf">CPF</Label>
              <Input
                id="cpf"
                name="cpf"
                type="text"
                placeholder="00000000000"
                maxLength={11}
                required
                disabled={loading}
                pattern="\d{11}"
                title="Digite apenas os 11 dígitos do CPF (sem pontos ou traços)"
              />
              <p className="text-xs text-muted-foreground">
                Apenas números, sem pontos ou traços
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="senha">Senha</Label>
              <Input
                id="senha"
                name="senha"
                type="password"
                placeholder="••••••••"
                required
                disabled={loading}
                minLength={6}
              />
              <p className="text-xs text-muted-foreground">
                Sua senha do portal PJE
              </p>
            </div>

            <Button type="submit" disabled={loading} className="w-full">
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {loading ? 'Autenticando...' : 'Fazer Login'}
            </Button>
          </form>

          {result && (
            <div className="mt-6">
              <Alert variant={result.success ? 'default' : 'destructive'}>
                {result.success ? (
                  <CheckCircle className="h-4 w-4" />
                ) : (
                  <XCircle className="h-4 w-4" />
                )}
                <AlertDescription>
                  <strong>{result.message}</strong>
                  {result.perfil && (
                    <div className="mt-2 space-y-1 text-sm">
                      <p>Nome: {result.perfil.nome}</p>
                      {result.perfil.oab && <p>OAB: {result.perfil.oab}</p>}
                      <p>Tribunal: {result.perfil.tribunal}</p>
                    </div>
                  )}
                  {result.error && (
                    <p className="mt-2 text-sm text-muted-foreground">
                      Erro: {result.error}
                    </p>
                  )}
                </AlertDescription>
              </Alert>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="h-5 w-5" />
            Informações Importantes
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <div>
            <h4 className="font-semibold">Segurança</h4>
            <p className="text-muted-foreground">
              Suas credenciais são processadas diretamente no servidor e nunca são armazenadas.
              O login é feito através do mesmo fluxo SSO oficial do PJE.
            </p>
          </div>

          <div>
            <h4 className="font-semibold">Anti-Detecção</h4>
            <p className="text-muted-foreground">
              O sistema utiliza técnicas avançadas de anti-detecção para evitar bloqueios
              do CloudFront (WAF do PJE). Caso receba erro 403, aguarde alguns minutos antes
              de tentar novamente.
            </p>
          </div>

          <div>
            <h4 className="font-semibold">Tempo de Resposta</h4>
            <p className="text-muted-foreground">
              O processo de login pode levar de 10 a 30 segundos, pois simula comportamento
              humano para evitar detecção. Aguarde a conclusão antes de tentar novamente.
            </p>
          </div>

          <div>
            <h4 className="font-semibold">Troubleshooting</h4>
            <ul className="list-inside list-disc space-y-1 text-muted-foreground">
              <li>Verifique se CPF está correto (apenas números)</li>
              <li>Verifique se a senha está correta</li>
              <li>Se receber erro 403, aguarde 5-10 minutos</li>
              <li>Certifique-se de estar conectado à internet</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

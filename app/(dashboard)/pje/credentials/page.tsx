'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Loader2, Plus, Trash2, Edit, CheckCircle, XCircle, Building2, User, Key } from 'lucide-react';
import {
  listEscritoriosAction,
  createEscritorioAction,
  deleteEscritorioAction,
  listAdvogadosAction,
  createAdvogadoAction,
  deleteAdvogadoAction,
  listCredenciaisAction,
  createCredencialAction,
  deleteCredencialAction,
  toggleCredencialAction,
  testCredencialAction,
  listTribunalConfigsAction,
} from '@/app/actions/pje';
import type {
  EscritorioWithAdvogados,
  AdvogadoWithCredenciais,
  CredencialWithRelations,
} from '@/lib/types';
import { TribunalSelector } from '@/components/pje/tribunal-selector';
import type { TribunalConfigConstant } from '@/lib/constants/tribunais';

export default function CredentialsPage() {
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<{type: 'success' | 'error'; text: string} | null>(null);
  const [escritorios, setEscritorios] = useState<EscritorioWithAdvogados[]>([]);
  const [advogados, setAdvogados] = useState<AdvogadoWithCredenciais[]>([]);
  const [selectedEscritorio, setSelectedEscritorio] = useState<string | null>(null);
  const [selectedAdvogado, setSelectedAdvogado] = useState<string | null>(null);

  // Dialogs
  const [escritorioDialog, setEscritorioDialog] = useState(false);
  const [advogadoDialog, setAdvogadoDialog] = useState(false);
  const [credencialDialog, setCredencialDialog] = useState(false);

  // Forms
  const [escritorioForm, setEscritorioForm] = useState({ nome: '' });
  const [advogadoForm, setAdvogadoForm] = useState({
    nome: '',
    oabNumero: '',
    oabUf: '',
    cpf: '',
    escritorioId: '' as string | null,
  });
  const [credencialForm, setCredencialForm] = useState({
    senha: '',
    descricao: '',
    tribunalConfigIds: [] as string[],
  });

  // Available tribunal configs (from constants)
  const [tribunalConfigs, setTribunalConfigs] = useState<TribunalConfigConstant[]>([]);

  useEffect(() => {
    loadData();
    loadTribunalConfigs();
  }, []);

  async function loadData() {
    setLoading(true);
    setMessage(null); // Limpa mensagens anteriores
    try {
      const result = await listEscritoriosAction();
      if (result.success) {
        setEscritorios(result.data);
      } else if (result.error) {
        console.error('Erro ao listar escritórios:', result.error);
        setMessage({ type: 'error', text: `Erro ao carregar escritórios: ${result.error}` });
      }

      const advResult = await listAdvogadosAction();
      if (advResult.success) {
        setAdvogados(advResult.data);
      } else if (advResult.error) {
        console.error('Erro ao listar advogados:', advResult.error);
        setMessage({ type: 'error', text: `Erro ao carregar advogados: ${advResult.error}` });
      }
    } catch (error) {
      console.error('Exceção ao carregar dados:', error);
      setMessage({ type: 'error', text: `Erro inesperado: ${error instanceof Error ? error.message : 'Erro desconhecido'}` });
    } finally {
      setLoading(false);
    }
  }

  async function loadTribunalConfigs() {
    // Busca todos os TribunalConfigs do banco (TRTs, TJs, TRFs, Superiores)
    const result = await listTribunalConfigsAction();
    if (result.success) {
      setTribunalConfigs(result.data as TribunalConfigConstant[]);
    } else {
      console.error('Erro ao carregar tribunais:', result.error);
      setMessage({ type: 'error', text: `Erro ao carregar tribunais: ${result.error}` });
    }
  }

  async function handleCreateEscritorio() {
    if (!escritorioForm.nome.trim()) {
      setMessage({ type: 'error', text: 'Nome do escritório é obrigatório' });
      return;
    }

    const result = await createEscritorioAction({ nome: escritorioForm.nome });

    if (result.success) {
      setMessage({ type: 'success', text: 'Escritório criado com sucesso' });
      setEscritorioDialog(false);
      setEscritorioForm({ nome: '' });
      loadData();
    } else {
      setMessage({ type: 'error', text: result.error || 'Erro ao criar escritório' });
    }
  }

  async function handleDeleteEscritorio(id: string) {
    if (!confirm('Deseja realmente deletar este escritório?')) return;

    const result = await deleteEscritorioAction(id);

    if (result.success) {
      setMessage({ type: 'success', text: 'Escritório deletado com sucesso' });
      if (selectedEscritorio === id) setSelectedEscritorio(null);
      loadData();
    } else {
      setMessage({ type: 'error', text: result.error || 'Erro ao deletar escritório' });
    }
  }

  async function handleCreateAdvogado() {
    const result = await createAdvogadoAction({
      nome: advogadoForm.nome,
      oabNumero: advogadoForm.oabNumero,
      oabUf: advogadoForm.oabUf.toUpperCase(),
      cpf: advogadoForm.cpf.replace(/\D/g, ''),
      escritorioId: advogadoForm.escritorioId || null,
    });

    if (result.success) {
      setMessage({ type: 'success', text: 'Advogado criado com sucesso' });
      setAdvogadoDialog(false);
      setAdvogadoForm({ nome: '', oabNumero: '', oabUf: '', cpf: '', escritorioId: null });
      loadData();
    } else {
      setMessage({ type: 'error', text: result.error || 'Erro ao criar advogado' });
    }
  }

  async function handleDeleteAdvogado(id: string) {
    if (!confirm('Deseja realmente deletar este advogado? Todas as credenciais serão removidas.')) return;

    const result = await deleteAdvogadoAction(id);

    if (result.success) {
      setMessage({ type: 'success', text: 'Advogado deletado com sucesso' });
      if (selectedAdvogado === id) setSelectedAdvogado(null);
      loadData();
    } else {
      setMessage({ type: 'error', text: result.error || 'Erro ao deletar advogado' });
    }
  }

  async function handleCreateCredencial() {
    if (!selectedAdvogado) return;

    const result = await createCredencialAction({
      advogadoId: selectedAdvogado,
      senha: credencialForm.senha,
      descricao: credencialForm.descricao,
      tribunalConfigIds: credencialForm.tribunalConfigIds,
    });

    if (result.success) {
      setMessage({ type: 'success', text: 'Credencial criada com sucesso' });
      setCredencialDialog(false);
      setCredencialForm({ senha: '', descricao: '', tribunalConfigIds: [] });
      loadData();
    } else {
      setMessage({ type: 'error', text: result.error || 'Erro ao criar credencial' });
    }
  }

  async function handleDeleteCredencial(id: string) {
    if (!confirm('Deseja realmente deletar esta credencial?')) return;

    const result = await deleteCredencialAction(id);

    if (result.success) {
      setMessage({ type: 'success', text: 'Credencial deletada com sucesso' });
      loadData();
    } else {
      setMessage({ type: 'error', text: result.error || 'Erro ao deletar credencial' });
    }
  }

  async function handleToggleCredencial(id: string) {
    const result = await toggleCredencialAction(id);

    if (result.success) {
      setMessage({ type: 'success', text: 'Status da credencial alterado' });
      loadData();
    } else {
      setMessage({ type: 'error', text: result.error || 'Erro ao alterar status' });
    }
  }

  const selectedAdvogadoData = advogados.find(a => a.id === selectedAdvogado);
  const soloAdvogados = advogados.filter(a => a.escritorioId === null);

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Gerenciamento de Credenciais PJE</h1>
        <p className="text-muted-foreground">
          Configure escritórios, advogados e credenciais para acesso ao PJE
        </p>
      </div>

      {message && (
        <Alert variant={message.type === 'error' ? 'destructive' : 'default'}>
          {message.type === 'success' ? <CheckCircle className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
          <AlertDescription>{message.text}</AlertDescription>
        </Alert>
      )}

      {/* Escritórios e Advogados Solo */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Escritórios
              </CardTitle>
              <CardDescription>Escritórios cadastrados e advogados autônomos</CardDescription>
            </div>
            <Button onClick={() => setEscritorioDialog(true)} size="sm">
              <Plus className="mr-2 h-4 w-4" />
              Novo Escritório
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {escritorios.map((escritorio) => (
            <div
              key={escritorio.id}
              className={`rounded-lg border p-4 cursor-pointer transition-colors ${
                selectedEscritorio === escritorio.id ? 'border-primary bg-primary/5' : 'hover:border-primary/50'
              }`}
              onClick={() => setSelectedEscritorio(escritorio.id)}
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold">{escritorio.nome}</h3>
                  <p className="text-sm text-muted-foreground">
                    {escritorio.advogados.length} advogado(s)
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteEscritorio(escritorio.id);
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}

          {escritorios.length === 0 && soloAdvogados.length === 0 && (
            <div className="py-12 text-center">
              <Building2 className="mx-auto h-12 w-12 text-muted-foreground/50" />
              <h3 className="mt-4 text-lg font-semibold">Nenhum escritório ou advogado cadastrado</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Comece criando um escritório ou cadastre-se como advogado autônomo
              </p>
              <div className="mt-6 flex justify-center gap-4">
                <Button onClick={() => setEscritorioDialog(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Criar Escritório
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setAdvogadoForm({ ...advogadoForm, escritorioId: null });
                    setAdvogadoDialog(true);
                  }}
                >
                  <User className="mr-2 h-4 w-4" />
                  Cadastrar como Autônomo
                </Button>
              </div>
            </div>
          )}

          {soloAdvogados.length > 0 && (
            <div>
              <h3 className="mb-2 text-sm font-semibold">Advogados Autônomos</h3>
              {soloAdvogados.map((adv) => (
                <div
                  key={adv.id}
                  className={`rounded-lg border p-3 cursor-pointer transition-colors mb-2 ${
                    selectedAdvogado === adv.id ? 'border-primary bg-primary/5' : 'hover:border-primary/50'
                  }`}
                  onClick={() => setSelectedAdvogado(adv.id)}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-sm">{adv.nome}</p>
                      <p className="text-xs text-muted-foreground">
                        OAB {adv.oabNumero}/{adv.oabUf} • {adv.credenciais.length} credencial(is)
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteAdvogado(adv.id);
                      }}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Advogados do Escritório Selecionado */}
      {selectedEscritorio && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Advogados
                </CardTitle>
                <CardDescription>
                  {escritorios.find(e => e.id === selectedEscritorio)?.nome}
                </CardDescription>
              </div>
              <Button
                onClick={() => {
                  setAdvogadoForm({ ...advogadoForm, escritorioId: selectedEscritorio });
                  setAdvogadoDialog(true);
                }}
                size="sm"
              >
                <Plus className="mr-2 h-4 w-4" />
                Novo Advogado
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            {advogados
              .filter(a => a.escritorioId === selectedEscritorio)
              .map((advogado) => (
                <div
                  key={advogado.id}
                  className={`rounded-lg border p-3 cursor-pointer transition-colors ${
                    selectedAdvogado === advogado.id ? 'border-primary bg-primary/5' : 'hover:border-primary/50'
                  }`}
                  onClick={() => setSelectedAdvogado(advogado.id)}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">{advogado.nome}</h4>
                      <p className="text-sm text-muted-foreground">
                        OAB {advogado.oabNumero}/{advogado.oabUf} • CPF ***.***.{advogado.cpf.slice(-3)} • {advogado.credenciais.length} credencial(is)
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteAdvogado(advogado.id);
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
          </CardContent>
        </Card>
      )}

      {/* Credenciais do Advogado Selecionado */}
      {selectedAdvogado && selectedAdvogadoData && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Key className="h-5 w-5" />
                  Credenciais
                </CardTitle>
                <CardDescription>{selectedAdvogadoData.nome}</CardDescription>
              </div>
              <Button onClick={() => setCredencialDialog(true)} size="sm">
                <Plus className="mr-2 h-4 w-4" />
                Nova Credencial
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {selectedAdvogadoData.credenciais.map((cred) => (
              <div key={cred.id} className="rounded-lg border p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{cred.descricao || 'Sem descrição'}</p>
                      <Badge variant={cred.ativa ? 'default' : 'secondary'}>
                        {cred.ativa ? 'Ativa' : 'Inativa'}
                      </Badge>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Senha: ******** (oculta)
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Tribunais: {cred.tribunais.length} configurado(s)
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleToggleCredencial(cred.id)}
                    >
                      {cred.ativa ? 'Desativar' : 'Ativar'}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteCredencial(cred.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
            {selectedAdvogadoData.credenciais.length === 0 && (
              <p className="text-center text-sm text-muted-foreground py-8">
                Nenhuma credencial cadastrada
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Dialog: Criar Escritório */}
      <Dialog open={escritorioDialog} onOpenChange={setEscritorioDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Novo Escritório</DialogTitle>
            <DialogDescription>Cadastre um novo escritório de advocacia</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="escritorio-nome">Nome do Escritório</Label>
              <Input
                id="escritorio-nome"
                value={escritorioForm.nome}
                onChange={(e) => setEscritorioForm({ nome: e.target.value })}
                placeholder="Ex: Silva & Matos Advogados"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEscritorioDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCreateEscritorio}>Criar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog: Criar Advogado */}
      <Dialog open={advogadoDialog} onOpenChange={setAdvogadoDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Novo Advogado</DialogTitle>
            <DialogDescription>Cadastre um novo advogado</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="adv-nome">Nome Completo</Label>
              <Input
                id="adv-nome"
                value={advogadoForm.nome}
                onChange={(e) => setAdvogadoForm({ ...advogadoForm, nome: e.target.value })}
                placeholder="Dr. João Silva"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="adv-oab">Número OAB</Label>
                <Input
                  id="adv-oab"
                  value={advogadoForm.oabNumero}
                  onChange={(e) => setAdvogadoForm({ ...advogadoForm, oabNumero: e.target.value })}
                  placeholder="123456"
                />
              </div>
              <div>
                <Label htmlFor="adv-uf">UF</Label>
                <Input
                  id="adv-uf"
                  value={advogadoForm.oabUf}
                  onChange={(e) => setAdvogadoForm({ ...advogadoForm, oabUf: e.target.value.toUpperCase() })}
                  placeholder="MG"
                  maxLength={2}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="adv-cpf">CPF</Label>
              <Input
                id="adv-cpf"
                value={advogadoForm.cpf}
                onChange={(e) => setAdvogadoForm({ ...advogadoForm, cpf: e.target.value })}
                placeholder="00000000000"
                maxLength={11}
              />
            </div>
            <div>
              <Label htmlFor="adv-escritorio">Escritório (opcional)</Label>
              <Select
                value={advogadoForm.escritorioId || 'solo'}
                onValueChange={(val: string) =>
                  setAdvogadoForm({ ...advogadoForm, escritorioId: val === 'solo' ? null : val })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="solo">Advogado Autônomo</SelectItem>
                  {escritorios.map((e) => (
                    <SelectItem key={e.id} value={e.id}>
                      {e.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAdvogadoDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCreateAdvogado}>Criar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog: Criar Credencial */}
      <Dialog open={credencialDialog} onOpenChange={setCredencialDialog}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>Nova Credencial</DialogTitle>
            <DialogDescription>Cadastre uma nova senha para acesso ao PJE</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 overflow-y-auto flex-1 px-1">
            <div>
              <Label htmlFor="cred-senha">Senha</Label>
              <Input
                id="cred-senha"
                type="password"
                value={credencialForm.senha}
                onChange={(e) => setCredencialForm({ ...credencialForm, senha: e.target.value })}
                placeholder="••••••••"
              />
            </div>
            <div>
              <Label htmlFor="cred-desc">Descrição (opcional)</Label>
              <Input
                id="cred-desc"
                value={credencialForm.descricao}
                onChange={(e) => setCredencialForm({ ...credencialForm, descricao: e.target.value })}
                placeholder="Ex: Senha TRT3 1º grau"
              />
            </div>
            <TribunalSelector
              tribunais={tribunalConfigs}
              selectedIds={credencialForm.tribunalConfigIds}
              onChange={(ids) => setCredencialForm({ ...credencialForm, tribunalConfigIds: ids })}
            />
          </div>
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setCredencialDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCreateCredencial}>Criar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

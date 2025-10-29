'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { ChevronRight, Eye, EyeOff, Key, Loader2, Trash2 } from 'lucide-react';
import type { AdvogadoWithCredenciais } from '@/lib/types';
import {
  getAdvogadoAction,
  updateAdvogadoAction,
  updateEscritorioAction,
  deleteCredencialAction,
  toggleCredencialAction,
  createCredencialAction,
  updateCredencialAction,
  listTribunalConfigsAction,
  deleteAdvogadoAction,
} from '@/app/actions/pje';
import { toast } from 'sonner';
import { useCredentialsStore } from '@/lib/stores/credentials-store';

const UFS = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA',
  'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN',
  'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO',
];

interface LawyerDetailModalProps {
  lawyerId: string | null;
  onClose: () => void;
  onUpdate: () => void;
}

export function LawyerDetailModal({ lawyerId, onClose, onUpdate }: LawyerDetailModalProps) {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [advogado, setAdvogado] = useState<AdvogadoWithCredenciais | null>(null);
  const [activeTab, setActiveTab] = useState('lawyer-info');
  const [visiblePasswords, setVisiblePasswords] = useState<Set<string>>(new Set());
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [credentialToDelete, setCredentialToDelete] = useState<string | null>(null);
  const [deleteAdvogadoDialog, setDeleteAdvogadoDialog] = useState(false);

  // Add credential dialog state
  const [addCredentialDialog, setAddCredentialDialog] = useState(false);
  const [tribunaisDisponiveis, setTribunaisDisponiveis] = useState<any[]>([]);
  const [credentialForm, setCredentialForm] = useState({
    senha: '',
    descricao: '',
    tribunalConfigIds: [] as string[],
  });

  // Edit credential dialog state
  const [editCredentialDialog, setEditCredentialDialog] = useState(false);
  const [editingCredentialId, setEditingCredentialId] = useState<string | null>(null);
  const [editCredentialForm, setEditCredentialForm] = useState({
    senha: '',
    descricao: '',
    tribunalConfigIds: [] as string[],
  });

  // Form state for lawyer info
  const [lawyerForm, setLawyerForm] = useState({
    nome: '',
    oabNumero: '',
    oabUf: '',
    cpf: '',
    escritorioNome: '',
  });

  useEffect(() => {
    if (lawyerId) {
      loadAdvogado();
      loadTribunais();
    }
  }, [lawyerId]);

  async function loadTribunais() {
    try {
      console.log('Iniciando carregamento de tribunais...');
      const result = await listTribunalConfigsAction();
      console.log('Resultado tribunais:', result);

      if (result.success) {
        if (result.data && Array.isArray(result.data)) {
          console.log('Tribunais carregados com sucesso:', result.data.length);
          setTribunaisDisponiveis(result.data);

          if (result.data.length === 0) {
            setMessage({ type: 'error', text: 'Nenhum tribunal disponível no sistema' });
          }
        } else {
          console.error('Dados inválidos:', result.data);
          setMessage({ type: 'error', text: 'Dados de tribunais inválidos' });
        }
      } else {
        console.error('Falha ao carregar tribunais:', result.error);
        setMessage({ type: 'error', text: result.error || 'Erro ao carregar tribunais' });
      }
    } catch (error) {
      console.error('Erro ao carregar tribunais:', error);
      setMessage({ type: 'error', text: 'Erro ao carregar tribunais: ' + (error instanceof Error ? error.message : 'Desconhecido') });
    }
  }

  async function loadAdvogado() {
    if (!lawyerId) return;
    setLoading(true);
    setMessage(null);

    try {
      const result = await getAdvogadoAction(lawyerId);
      if (result.success && result.data) {
        setAdvogado(result.data);
        setLawyerForm({
          nome: result.data.nome,
          oabNumero: result.data.oabNumero,
          oabUf: result.data.oabUf,
          cpf: result.data.cpf,
          escritorioNome: result.data.escritorio?.nome || '',
        });
      } else {
        setMessage({ type: 'error', text: result.error || 'Erro ao carregar advogado' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Erro ao carregar advogado' });
    } finally {
      setLoading(false);
    }
  }

  async function handleSaveLawyerInfo() {
    if (!advogado) return;
    setSaving(true);
    setMessage(null);

    try {
      // Update lawyer info
      const advogadoResult = await updateAdvogadoAction(advogado.id, {
        nome: lawyerForm.nome,
        oabNumero: lawyerForm.oabNumero,
        oabUf: lawyerForm.oabUf,
        cpf: lawyerForm.cpf,
        escritorioId: advogado.escritorioId,
      });

      if (!advogadoResult.success) {
        setMessage({ type: 'error', text: advogadoResult.error || 'Erro ao atualizar advogado' });
        return;
      }

      // Update escritório name if changed
      if (advogado.escritorio && lawyerForm.escritorioNome !== advogado.escritorio.nome) {
        const escritorioResult = await updateEscritorioAction(advogado.escritorio.id, {
          nome: lawyerForm.escritorioNome,
        });

        if (!escritorioResult.success) {
          setMessage({ type: 'error', text: escritorioResult.error || 'Erro ao atualizar escritório' });
          return;
        }
      }

      setMessage({ type: 'success', text: 'Dados atualizados com sucesso!' });
      onUpdate();
      await loadAdvogado();
    } catch (error) {
      setMessage({ type: 'error', text: 'Erro ao salvar dados' });
    } finally {
      setSaving(false);
    }
  }

  function handleDeleteAdvogado() {
    setDeleteAdvogadoDialog(true);
  }

  async function confirmDeleteAdvogado() {
    if (!advogado) return;

    setSaving(true);
    setMessage(null);

    try {
      const result = await deleteAdvogadoAction(advogado.id);

      if (result.success) {
        toast.success('Advogado excluído com sucesso!');
        setDeleteAdvogadoDialog(false);
        // Refresh credentials store (credentials are deleted with advogado)
        useCredentialsStore.getState().invalidate();
        onUpdate();
        onClose();
      } else {
        setMessage({ type: 'error', text: result.error || 'Erro ao excluir advogado' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Erro ao excluir advogado' });
    } finally {
      setSaving(false);
    }
  }

  async function handleToggleCredencial(credencialId: string) {
    const result = await toggleCredencialAction(credencialId);
    if (result.success) {
      setMessage({ type: 'success', text: 'Status atualizado' });
      await loadAdvogado();
      // Refresh credentials store
      useCredentialsStore.getState().invalidate();
    } else {
      setMessage({ type: 'error', text: result.error || 'Erro ao atualizar status' });
    }
  }

  async function handleDeleteCredencial(credencialId: string) {
    setCredentialToDelete(credencialId);
  }

  async function confirmDeleteCredencial() {
    if (!credentialToDelete) return;

    const result = await deleteCredencialAction(credentialToDelete);
    if (result.success) {
      setMessage({ type: 'success', text: 'Credencial excluída' });
      await loadAdvogado();
      // Refresh credentials store
      useCredentialsStore.getState().invalidate();
    } else {
      setMessage({ type: 'error', text: result.error || 'Erro ao excluir credencial' });
    }
    setCredentialToDelete(null);
  }


  function togglePasswordVisibility(credencialId: string) {
    setVisiblePasswords((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(credencialId)) {
        newSet.delete(credencialId);
      } else {
        newSet.add(credencialId);
      }
      return newSet;
    });
  }

  function handleAddCredencial() {
    setAddCredentialDialog(true);
  }

  async function handleSubmitCredencial() {
    if (!advogado) return;

    // Validações
    if (!credentialForm.senha || credentialForm.senha.length < 6) {
      setMessage({ type: 'error', text: 'Senha deve ter no mínimo 6 caracteres' });
      return;
    }

    if (credentialForm.tribunalConfigIds.length === 0) {
      setMessage({ type: 'error', text: 'Selecione pelo menos um tribunal' });
      return;
    }

    setSaving(true);
    setMessage(null);

    try {
      const result = await createCredencialAction({
        advogadoId: advogado.id,
        senha: credentialForm.senha,
        descricao: credentialForm.descricao || undefined,
        tribunalConfigIds: credentialForm.tribunalConfigIds,
      });

      if (result.success) {
        toast.success('Credencial adicionada com sucesso!');
        setAddCredentialDialog(false);
        setCredentialForm({
          senha: '',
          descricao: '',
          tribunalConfigIds: [],
        });
        await loadAdvogado();
        // Refresh credentials store
        useCredentialsStore.getState().invalidate();
      } else {
        setMessage({ type: 'error', text: result.error || 'Erro ao adicionar credencial' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Erro ao adicionar credencial' });
    } finally {
      setSaving(false);
    }
  }

  function toggleTribunal(tribunalId: string) {
    setCredentialForm((prev) => {
      const isSelected = prev.tribunalConfigIds.includes(tribunalId);
      return {
        ...prev,
        tribunalConfigIds: isSelected
          ? prev.tribunalConfigIds.filter((id) => id !== tribunalId)
          : [...prev.tribunalConfigIds, tribunalId],
      };
    });
  }

  function toggleTribunalEdit(tribunalId: string) {
    setEditCredentialForm((prev) => {
      const isSelected = prev.tribunalConfigIds.includes(tribunalId);
      return {
        ...prev,
        tribunalConfigIds: isSelected
          ? prev.tribunalConfigIds.filter((id) => id !== tribunalId)
          : [...prev.tribunalConfigIds, tribunalId],
      };
    });
  }

  function handleEditCredencial(credencialId: string) {
    if (!advogado) return;

    const credencial = advogado.credenciais.find((c) => c.id === credencialId);
    if (!credencial) return;

    // Populate form with existing credential data
    setEditingCredentialId(credencialId);
    setEditCredentialForm({
      senha: '', // Don't pre-fill password for security
      descricao: credencial.descricao || '',
      tribunalConfigIds: credencial.tribunais.map((t) => {
        const config = t.tribunalConfig;
        return `${config.tribunal.codigo}-${config.sistema}-${config.grau}`;
      }),
    });
    setEditCredentialDialog(true);
  }

  async function handleSubmitEditCredencial() {
    if (!editingCredentialId) return;

    setSaving(true);
    setMessage(null);

    try {
      const updateData: any = {
        descricao: editCredentialForm.descricao || undefined,
        tribunalConfigIds: editCredentialForm.tribunalConfigIds,
      };

      // Only include password if user entered one
      if (editCredentialForm.senha && editCredentialForm.senha.length >= 6) {
        updateData.senha = editCredentialForm.senha;
      }

      const result = await updateCredencialAction(editingCredentialId, updateData);

      if (result.success) {
        toast.success('Credencial atualizada com sucesso!');
        setEditCredentialDialog(false);
        setEditingCredentialId(null);
        setEditCredentialForm({
          senha: '',
          descricao: '',
          tribunalConfigIds: [],
        });
        await loadAdvogado();
        // Refresh credentials store
        useCredentialsStore.getState().invalidate();
      } else {
        setMessage({ type: 'error', text: result.error || 'Erro ao atualizar credencial' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Erro ao atualizar credencial' });
    } finally {
      setSaving(false);
    }
  }

  if (!lawyerId) return null;

  return (
    <Dialog open={Boolean(lawyerId)} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg">
            <span className="text-muted-foreground">{advogado?.escritorio?.nome}</span>
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
            <span>{advogado?.nome}</span>
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
          <>
            {message && (
              <div className={`p-3 rounded-lg text-sm ${message.type === 'success' ? 'bg-green-50 text-green-800 dark:bg-green-900/20 dark:text-green-300' : 'bg-red-50 text-red-800 dark:bg-red-900/20 dark:text-red-300'}`}>
                {message.text}
              </div>
            )}

            <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="lawyer-info">Dados do Advogado</TabsTrigger>
                <TabsTrigger value="credentials">Credenciais</TabsTrigger>
              </TabsList>

              <TabsContent value="lawyer-info" className="flex-1 overflow-y-auto space-y-6 mt-4">
                {/* Informações do Escritório */}
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
                    Informações do Escritório
                  </h3>
                  <div>
                    <Label htmlFor="escritorioNome">Nome do Escritório</Label>
                    <Input
                      id="escritorioNome"
                      value={lawyerForm.escritorioNome}
                      onChange={(e) => setLawyerForm({ ...lawyerForm, escritorioNome: e.target.value })}
                      placeholder="Nome do escritório"
                    />
                  </div>
                </div>

                {/* Informações do Advogado */}
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
                    Informações do Advogado
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="nome">Nome Completo</Label>
                      <Input
                        id="nome"
                        value={lawyerForm.nome}
                        onChange={(e) => setLawyerForm({ ...lawyerForm, nome: e.target.value })}
                        placeholder="Nome completo"
                      />
                    </div>
                    <div>
                      <Label htmlFor="cpf">CPF</Label>
                      <Input
                        id="cpf"
                        value={lawyerForm.cpf}
                        onChange={(e) => setLawyerForm({ ...lawyerForm, cpf: e.target.value.replace(/\D/g, '') })}
                        placeholder="00000000000"
                        maxLength={11}
                      />
                    </div>
                    <div>
                      <Label htmlFor="oabNumero">OAB Número</Label>
                      <Input
                        id="oabNumero"
                        value={lawyerForm.oabNumero}
                        onChange={(e) => setLawyerForm({ ...lawyerForm, oabNumero: e.target.value.replace(/\D/g, '') })}
                        placeholder="123456"
                      />
                    </div>
                    <div>
                      <Label htmlFor="oabUf">OAB Estado</Label>
                      <Select
                        value={lawyerForm.oabUf}
                        onValueChange={(value) => setLawyerForm({ ...lawyerForm, oabUf: value })}
                      >
                        <SelectTrigger id="oabUf">
                          <SelectValue placeholder="Selecione o estado" />
                        </SelectTrigger>
                        <SelectContent>
                          {UFS.map((uf) => (
                            <SelectItem key={uf} value={uf}>
                              {uf}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                <div className="flex justify-between pt-4 border-t">
                  <Button
                    variant="destructive"
                    onClick={handleDeleteAdvogado}
                    disabled={saving}
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Excluir Advogado
                  </Button>
                  <div className="flex gap-3">
                    <Button variant="outline" onClick={onClose} disabled={saving}>
                      Cancelar
                    </Button>
                    <Button onClick={handleSaveLawyerInfo} disabled={saving}>
                      {saving ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Salvando...
                        </>
                      ) : (
                        'Salvar Alterações'
                      )}
                    </Button>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="credentials" className="flex-1 flex flex-col mt-4">
                <div className="flex-shrink-0 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                      Lista de Credenciais ({advogado?.credenciais.length || 0})
                    </h3>
                    <Button size="sm" onClick={handleAddCredencial}>Adicionar Credencial</Button>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto py-4 min-h-0">
                  {advogado?.credenciais && advogado.credenciais.length > 0 ? (
                    <div className="space-y-3">
                      {advogado.credenciais.map((credencial) => (
                        <div
                          key={credencial.id}
                          className="p-4 rounded-lg border bg-card space-y-3"
                        >
                          {/* Header */}
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-2">
                              <Key className="w-5 h-5 text-yellow-600" />
                              <span className="font-semibold">{credencial.descricao || 'Sem descrição'}</span>
                            </div>
                            <Badge variant={credencial.ativa ? 'default' : 'secondary'}>
                              {credencial.ativa ? 'Ativa' : 'Inativa'}
                            </Badge>
                          </div>

                          {/* Senha */}
                          <div className="flex items-center gap-2 text-sm">
                            <span className="text-muted-foreground font-medium">Senha:</span>
                            <code className="bg-muted px-2 py-1 rounded">
                              {visiblePasswords.has(credencial.id) ? credencial.senha : '••••••••'}
                            </code>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0"
                              onClick={() => togglePasswordVisibility(credencial.id)}
                            >
                              {visiblePasswords.has(credencial.id) ? (
                                <EyeOff className="w-3.5 h-3.5" />
                              ) : (
                                <Eye className="w-3.5 h-3.5" />
                              )}
                            </Button>
                          </div>

                          {/* Tribunais */}
                          <div className="text-sm">
                            <span className="text-muted-foreground font-medium">Tribunais:</span>{' '}
                            <span className="text-muted-foreground">
                              {credencial.tribunais.length} configurado(s)
                            </span>
                          </div>

                          {/* Actions */}
                          <div className="flex gap-2 flex-wrap">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleEditCredencial(credencial.id)}
                            >
                              Editar
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleToggleCredencial(credencial.id)}
                            >
                              {credencial.ativa ? 'Desativar' : 'Ativar'}
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              onClick={() => handleDeleteCredencial(credencial.id)}
                            >
                              <Trash2 className="w-3.5 h-3.5 mr-1" />
                              Excluir
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12 border-2 border-dashed rounded-lg">
                      <Key className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" />
                      <h3 className="text-lg font-semibold mb-1">Nenhuma credencial cadastrada</h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        Adicione credenciais para permitir acesso aos sistemas do PJE
                      </p>
                      <Button onClick={handleAddCredencial}>Adicionar Credencial</Button>
                    </div>
                  )}
                </div>

                <div className="flex-shrink-0 flex justify-end pt-4 border-t mt-4">
                  <Button variant="outline" onClick={onClose}>
                    Fechar
                  </Button>
                </div>
              </TabsContent>
            </Tabs>
          </>
        )}
      </DialogContent>

      {/* Add Credential Dialog */}
      <Dialog open={addCredentialDialog} onOpenChange={setAddCredentialDialog}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Adicionar Credencial</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {/* Senha */}
            <div>
              <Label htmlFor="cred-senha">
                Senha <span className="text-red-500">*</span>
              </Label>
              <Input
                id="cred-senha"
                type="password"
                value={credentialForm.senha}
                onChange={(e) => setCredentialForm({ ...credentialForm, senha: e.target.value })}
                placeholder="Mínimo 6 caracteres"
                minLength={6}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Esta senha será usada para login nos tribunais selecionados
              </p>
            </div>

            {/* Descrição */}
            <div>
              <Label htmlFor="cred-descricao">Descrição (opcional)</Label>
              <Input
                id="cred-descricao"
                value={credentialForm.descricao}
                onChange={(e) => setCredentialForm({ ...credentialForm, descricao: e.target.value })}
                placeholder="Ex: Credencial principal, Credencial backup, etc."
              />
            </div>

            {/* Tribunais */}
            <div className="space-y-3">
              <Label>
                Tribunais <span className="text-red-500">*</span>
              </Label>
              <p className="text-xs text-muted-foreground">
                Selecione os tribunais onde esta credencial será utilizada
              </p>

              {tribunaisDisponiveis.length === 0 ? (
                <div className="text-center py-8 border-2 border-dashed rounded-lg">
                  <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-primary" />
                  <p className="text-sm text-muted-foreground">Carregando tribunais...</p>
                  <p className="text-xs text-muted-foreground mt-2">
                    Se esta mensagem persistir, verifique o console para mais detalhes
                  </p>
                </div>
              ) : (
                <div className="border rounded-lg p-4 max-h-96 overflow-y-auto space-y-4">
                  {/* Group by tribunal type */}
                  {['TRT', 'TJ', 'TRF', 'TST', 'STJ', 'STF'].map((tipo) => {
                    const tribunaisPorTipo = tribunaisDisponiveis.filter((t) => {
                      // Determinar tipo do tribunal a partir do código
                      const codigo = t.codigo;
                      if (tipo === 'TRT') return codigo.startsWith('TRT');
                      if (tipo === 'TJ') return codigo.startsWith('TJ');
                      if (tipo === 'TRF') return codigo.startsWith('TRF');
                      if (tipo === 'TST') return codigo === 'TST';
                      if (tipo === 'STJ') return codigo === 'STJ';
                      if (tipo === 'STF') return codigo === 'STF';
                      return false;
                    });
                    if (tribunaisPorTipo.length === 0) return null;

                    return (
                      <div key={tipo} className="space-y-2">
                        <h4 className="font-semibold text-sm text-gray-700 dark:text-gray-300">
                          {tipo} ({tribunaisPorTipo.length})
                        </h4>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                          {tribunaisPorTipo.map((tribunal) => {
                            const isSelected = credentialForm.tribunalConfigIds.includes(
                              tribunal.id
                            );
                            return (
                              <div
                                key={tribunal.id}
                                className="flex items-start space-x-2 p-2 rounded border hover:bg-accent cursor-pointer"
                                onClick={() => toggleTribunal(tribunal.id)}
                              >
                                <Checkbox
                                  id={`tribunal-${tribunal.id}`}
                                  checked={isSelected}
                                  onCheckedChange={() => toggleTribunal(tribunal.id)}
                                />
                                <Label
                                  htmlFor={`tribunal-${tribunal.id}`}
                                  className="text-xs cursor-pointer flex-1"
                                >
                                  {tribunal.nomeCompleto}
                                  <span className="text-muted-foreground ml-1">
                                    ({tribunal.grau === '1g' ? '1º Grau' : tribunal.grau === '2g' ? '2º Grau' : 'Único'})
                                  </span>
                                </Label>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
              <p className="text-xs text-muted-foreground">
                {credentialForm.tribunalConfigIds.length} tribunal(is) selecionado(s)
              </p>
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => {
                setAddCredentialDialog(false);
                setCredentialForm({
                  senha: '',
                  descricao: '',
                  tribunalConfigIds: [],
                });
              }}
              disabled={saving}
            >
              Cancelar
            </Button>
            <Button onClick={handleSubmitCredencial} disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Adicionando...
                </>
              ) : (
                'Adicionar Credencial'
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Credential Dialog */}
      <Dialog open={editCredentialDialog} onOpenChange={setEditCredentialDialog}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Credencial</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {/* Senha */}
            <div>
              <Label htmlFor="edit-cred-senha">Nova Senha (opcional)</Label>
              <Input
                id="edit-cred-senha"
                type="password"
                value={editCredentialForm.senha}
                onChange={(e) => setEditCredentialForm({ ...editCredentialForm, senha: e.target.value })}
                placeholder="Deixe em branco para manter a atual"
                minLength={6}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Preencha apenas se desejar alterar a senha (mínimo 6 caracteres)
              </p>
            </div>

            {/* Descrição */}
            <div>
              <Label htmlFor="edit-cred-descricao">Descrição (opcional)</Label>
              <Input
                id="edit-cred-descricao"
                value={editCredentialForm.descricao}
                onChange={(e) => setEditCredentialForm({ ...editCredentialForm, descricao: e.target.value })}
                placeholder="Ex: Credencial principal, Credencial backup, etc."
              />
            </div>

            {/* Tribunais */}
            <div className="space-y-3">
              <Label>
                Tribunais <span className="text-red-500">*</span>
              </Label>
              <p className="text-xs text-muted-foreground">
                Selecione os tribunais onde esta credencial será utilizada
              </p>

              {tribunaisDisponiveis.length === 0 ? (
                <div className="text-center py-8 border-2 border-dashed rounded-lg">
                  <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-primary" />
                  <p className="text-sm text-muted-foreground">Carregando tribunais...</p>
                </div>
              ) : (
                <div className="border rounded-lg p-4 max-h-96 overflow-y-auto space-y-4">
                  {/* Group by tribunal type */}
                  {['TRT', 'TJ', 'TRF', 'TST', 'STJ', 'STF'].map((tipo) => {
                    const tribunaisPorTipo = tribunaisDisponiveis.filter((t) => {
                      const codigo = t.codigo;
                      if (tipo === 'TRT') return codigo.startsWith('TRT');
                      if (tipo === 'TJ') return codigo.startsWith('TJ');
                      if (tipo === 'TRF') return codigo.startsWith('TRF');
                      if (tipo === 'TST') return codigo === 'TST';
                      if (tipo === 'STJ') return codigo === 'STJ';
                      if (tipo === 'STF') return codigo === 'STF';
                      return false;
                    });
                    if (tribunaisPorTipo.length === 0) return null;

                    return (
                      <div key={tipo} className="space-y-2">
                        <h4 className="font-semibold text-sm text-gray-700 dark:text-gray-300">
                          {tipo} ({tribunaisPorTipo.length})
                        </h4>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                          {tribunaisPorTipo.map((tribunal) => {
                            const isSelected = editCredentialForm.tribunalConfigIds.includes(
                              tribunal.id
                            );
                            return (
                              <div
                                key={tribunal.id}
                                className="flex items-start space-x-2 p-2 rounded border hover:bg-accent cursor-pointer"
                                onClick={() => toggleTribunalEdit(tribunal.id)}
                              >
                                <Checkbox
                                  id={`edit-tribunal-${tribunal.id}`}
                                  checked={isSelected}
                                  onCheckedChange={() => toggleTribunalEdit(tribunal.id)}
                                />
                                <Label
                                  htmlFor={`edit-tribunal-${tribunal.id}`}
                                  className="text-xs cursor-pointer flex-1"
                                >
                                  {tribunal.nomeCompleto}
                                  <span className="text-muted-foreground ml-1">
                                    ({tribunal.grau === '1g' ? '1º Grau' : tribunal.grau === '2g' ? '2º Grau' : 'Único'})
                                  </span>
                                </Label>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
              <p className="text-xs text-muted-foreground">
                {editCredentialForm.tribunalConfigIds.length} tribunal(is) selecionado(s)
              </p>
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => {
                setEditCredentialDialog(false);
                setEditingCredentialId(null);
                setEditCredentialForm({
                  senha: '',
                  descricao: '',
                  tribunalConfigIds: [],
                });
              }}
              disabled={saving}
            >
              Cancelar
            </Button>
            <Button onClick={handleSubmitEditCredencial} disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Salvando...
                </>
              ) : (
                'Salvar Alterações'
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Credential Confirmation Dialog */}
      <AlertDialog open={!!credentialToDelete} onOpenChange={(open) => !open && setCredentialToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Credencial</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir esta credencial? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteCredencial}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Advogado Confirmation Dialog */}
      <AlertDialog open={deleteAdvogadoDialog} onOpenChange={setDeleteAdvogadoDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Advogado</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este advogado? Esta ação não pode ser desfeita.
              <span className="block mt-2 text-amber-600 font-medium">
                Todas as credenciais vinculadas a este advogado serão removidas.
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={saving}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteAdvogado}
              disabled={saving}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Excluindo...
                </>
              ) : (
                'Excluir'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Dialog>
  );
}

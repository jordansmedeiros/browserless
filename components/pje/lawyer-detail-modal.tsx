'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
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
import { ChevronRight, Eye, EyeOff, Key, Loader2, Trash2 } from 'lucide-react';
import type { AdvogadoWithCredenciais } from '@/lib/types';
import {
  getAdvogadoAction,
  updateAdvogadoAction,
  updateEscritorioAction,
  deleteCredencialAction,
  toggleCredencialAction,
  testCredencialAction,
} from '@/app/actions/pje';

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
    }
  }, [lawyerId]);

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

  async function handleToggleCredencial(credencialId: string) {
    const result = await toggleCredencialAction(credencialId);
    if (result.success) {
      setMessage({ type: 'success', text: 'Status atualizado' });
      await loadAdvogado();
    } else {
      setMessage({ type: 'error', text: result.error || 'Erro ao atualizar status' });
    }
  }

  async function handleDeleteCredencial(credencialId: string) {
    if (!confirm('Deseja realmente excluir esta credencial?')) return;

    const result = await deleteCredencialAction(credencialId);
    if (result.success) {
      setMessage({ type: 'success', text: 'Credencial excluída' });
      await loadAdvogado();
    } else {
      setMessage({ type: 'error', text: result.error || 'Erro ao excluir credencial' });
    }
  }

  async function handleTestCredencial(credencialId: string) {
    // Encontrar a credencial e pegar o primeiro tribunal configurado
    const credencial = advogado?.credenciais.find(c => c.id === credencialId);
    if (!credencial || credencial.tribunais.length === 0) {
      setMessage({ type: 'error', text: 'Credencial não possui tribunais configurados' });
      return;
    }

    const tribunalConfigId = credencial.tribunais[0].tribunalConfig.id;
    const result = await testCredencialAction(credencialId, tribunalConfigId);
    if (result.success) {
      setMessage({ type: 'success', text: `Teste realizado: ${result.message || 'Sucesso'}` });
      await loadAdvogado();
    } else {
      setMessage({ type: 'error', text: result.message || 'Erro ao testar credencial' });
    }
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

                <div className="flex justify-end gap-3 pt-4 border-t">
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
              </TabsContent>

              <TabsContent value="credentials" className="flex-1 overflow-y-auto space-y-4 mt-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                    Lista de Credenciais ({advogado?.credenciais.length || 0})
                  </h3>
                  <Button size="sm">Adicionar Credencial</Button>
                </div>

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
                          <Button size="sm" variant="outline">
                            Editar
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleTestCredencial(credencial.id)}
                          >
                            Testar
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
                    <Button>Adicionar Credencial</Button>
                  </div>
                )}

                <div className="flex justify-end pt-4 border-t">
                  <Button variant="outline" onClick={onClose}>
                    Fechar
                  </Button>
                </div>
              </TabsContent>
            </Tabs>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2, Plus, Building2, User, Eye, Search } from 'lucide-react';
import {
  listEscritoriosAction,
  createEscritorioAction,
  createAdvogadoAction,
} from '@/app/actions/pje';
import type {
  EscritorioWithAdvogados,
} from '@/lib/types';
import { LawyerDetailModal } from '@/components/pje/lawyer-detail-modal';

const UFS = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA',
  'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN',
  'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO',
];

export default function CredentialsPage() {
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<{type: 'success' | 'error'; text: string} | null>(null);
  const [escritorios, setEscritorios] = useState<EscritorioWithAdvogados[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLawyerId, setSelectedLawyerId] = useState<string | null>(null);

  // Dialogs
  const [escritorioDialog, setEscritorioDialog] = useState(false);
  const [advogadoDialog, setAdvogadoDialog] = useState(false);

  // Forms
  const [escritorioForm, setEscritorioForm] = useState({ nome: '' });
  const [advogadoForm, setAdvogadoForm] = useState({
    nome: '',
    oabNumero: '',
    oabUf: '',
    cpf: '',
    escritorioId: '',
    createNewFirm: false,
    newFirmName: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    setMessage(null);
    try {
      const result = await listEscritoriosAction();
      if (result.success) {
        setEscritorios(result.data);
      } else if (result.error) {
        setMessage({ type: 'error', text: `Erro ao carregar escritórios: ${result.error}` });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Erro ao carregar dados' });
    } finally {
      setLoading(false);
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

  async function handleCreateAdvogado() {
    // Validações
    if (!advogadoForm.nome.trim()) {
      setMessage({ type: 'error', text: 'Nome é obrigatório' });
      return;
    }
    if (!advogadoForm.oabNumero.trim()) {
      setMessage({ type: 'error', text: 'OAB é obrigatório' });
      return;
    }
    if (!advogadoForm.oabUf.trim()) {
      setMessage({ type: 'error', text: 'UF da OAB é obrigatório' });
      return;
    }
    if (!advogadoForm.cpf.trim() || advogadoForm.cpf.length !== 11) {
      setMessage({ type: 'error', text: 'CPF inválido (deve ter 11 dígitos)' });
      return;
    }

    let escritorioId = advogadoForm.escritorioId;

    // Se marcou para criar novo escritório
    if (advogadoForm.createNewFirm) {
      if (!advogadoForm.newFirmName.trim()) {
        setMessage({ type: 'error', text: 'Nome do escritório é obrigatório' });
        return;
      }

      const firmResult = await createEscritorioAction({ nome: advogadoForm.newFirmName });
      if (!firmResult.success || !firmResult.data) {
        setMessage({ type: 'error', text: firmResult.error || 'Erro ao criar escritório' });
        return;
      }
      escritorioId = firmResult.data.id;
    } else if (!escritorioId) {
      // Se não marcou para criar novo, mas não selecionou escritório existente,
      // criar escritório com nome do advogado (solo practice)
      const firmResult = await createEscritorioAction({ nome: advogadoForm.nome });
      if (!firmResult.success || !firmResult.data) {
        setMessage({ type: 'error', text: firmResult.error || 'Erro ao criar escritório' });
        return;
      }
      escritorioId = firmResult.data.id;
    }

    const result = await createAdvogadoAction({
      nome: advogadoForm.nome,
      oabNumero: advogadoForm.oabNumero,
      oabUf: advogadoForm.oabUf,
      cpf: advogadoForm.cpf,
      escritorioId,
    });

    if (result.success) {
      setMessage({ type: 'success', text: 'Advogado criado com sucesso' });
      setAdvogadoDialog(false);
      setAdvogadoForm({
        nome: '',
        oabNumero: '',
        oabUf: '',
        cpf: '',
        escritorioId: '',
        createNewFirm: false,
        newFirmName: '',
      });
      loadData();
    } else {
      setMessage({ type: 'error', text: result.error || 'Erro ao criar advogado' });
    }
  }

  // Filter escritórios by search term
  const filteredEscritorios = escritorios.filter((escritorio) => {
    const searchLower = searchTerm.toLowerCase();
    const matchFirm = escritorio.nome.toLowerCase().includes(searchLower);
    const matchLawyer = escritorio.advogados.some(
      (adv) =>
        adv.nome.toLowerCase().includes(searchLower) ||
        adv.oabNumero.includes(searchTerm) ||
        adv.cpf.includes(searchTerm)
    );
    return matchFirm || matchLawyer;
  });

  return (
    <div className="space-y-6">
        {/* Action Bar */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex flex-col sm:flex-row gap-3 flex-1">
          <Button onClick={() => setEscritorioDialog(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Novo Escritório
          </Button>
          <Button variant="outline" onClick={() => setAdvogadoDialog(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Novo Advogado
          </Button>
        </div>

        {/* Search */}
        <div className="relative sm:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar escritório ou advogado..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Messages */}
      {message && (
        <div
          className={`mb-4 p-3 rounded-lg text-sm ${
            message.type === 'success'
              ? 'bg-green-50 text-green-800 dark:bg-green-900/20 dark:text-green-300'
              : 'bg-red-50 text-red-800 dark:bg-red-900/20 dark:text-red-300'
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Loading */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : filteredEscritorios.length === 0 ? (
        /* Empty State */
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Building2 className="w-16 h-16 text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-semibold mb-1">Nenhum escritório encontrado</h3>
            <p className="text-sm text-muted-foreground mb-6">
              {searchTerm
                ? 'Nenhum resultado encontrado para sua busca'
                : 'Comece adicionando um novo escritório'}
            </p>
            {!searchTerm && (
              <Button onClick={() => setEscritorioDialog(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Adicionar Escritório
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        /* Accordion List */
        <Accordion type="multiple" className="space-y-4">
          {filteredEscritorios.map((escritorio) => {
            const isSolo = escritorio.advogados.length === 1;
            return (
              <AccordionItem
                key={escritorio.id}
                value={escritorio.id}
                className="border rounded-lg bg-card"
              >
                <AccordionTrigger className="px-4 hover:bg-accent/50 rounded-t-lg">
                  <div className="flex items-center gap-3 flex-1">
                    <Building2 className="w-5 h-5 text-muted-foreground" />
                    <span className="font-semibold">{escritorio.nome}</span>
                    {isSolo && (
                      <Badge variant="outline" className="text-xs">
                        Solo
                      </Badge>
                    )}
                    <Badge variant="secondary" className="text-xs ml-auto mr-2">
                      {escritorio.advogados.length} advogado{escritorio.advogados.length !== 1 ? 's' : ''}
                    </Badge>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-4 pb-4">
                  {escritorio.advogados.length === 0 ? (
                    <div className="text-center py-8 border-2 border-dashed rounded-lg">
                      <User className="w-10 h-10 mx-auto text-muted-foreground/50 mb-2" />
                      <p className="text-sm text-muted-foreground">
                        Nenhum advogado cadastrado neste escritório
                      </p>
                    </div>
                  ) : (
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                      {escritorio.advogados.map((advogado) => (
                        <button
                          key={advogado.id}
                          onClick={() => setSelectedLawyerId(advogado.id)}
                          className="p-4 rounded-lg border bg-background hover:bg-accent hover:border-primary transition-all text-left group"
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <User className="w-4 h-4 text-muted-foreground" />
                              <span className="font-semibold text-sm group-hover:text-primary">
                                {advogado.nome}
                              </span>
                            </div>
                            <Eye className="w-4 h-4 text-muted-foreground group-hover:text-primary" />
                          </div>
                          <div className="text-xs text-muted-foreground space-y-1">
                            <p>OAB/{advogado.oabUf} {advogado.oabNumero}</p>
                            <p>CPF: {advogado.cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '***.$2.$3-**')}</p>
                          </div>
                          <div className="mt-2">
                            <Badge variant="outline" className="text-xs">
                              {advogado.credenciais?.length || 0} credenciais
                            </Badge>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </AccordionContent>
              </AccordionItem>
            );
          })}
        </Accordion>
      )}

      {/* Dialog: Create Escritório */}
      <Dialog open={escritorioDialog} onOpenChange={setEscritorioDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Novo Escritório</DialogTitle>
            <DialogDescription>
              Adicione um novo escritório de advocacia
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="escritorio-nome">Nome do Escritório</Label>
              <Input
                id="escritorio-nome"
                value={escritorioForm.nome}
                onChange={(e) => setEscritorioForm({ nome: e.target.value })}
                placeholder="Ex: Silva & Associados"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEscritorioDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCreateEscritorio}>Criar Escritório</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog: Create Advogado */}
      <Dialog open={advogadoDialog} onOpenChange={setAdvogadoDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Novo Advogado</DialogTitle>
            <DialogDescription>
              Adicione um novo advogado ao sistema
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="adv-nome">Nome Completo</Label>
                <Input
                  id="adv-nome"
                  value={advogadoForm.nome}
                  onChange={(e) => setAdvogadoForm({ ...advogadoForm, nome: e.target.value })}
                  placeholder="Nome completo"
                />
              </div>
              <div>
                <Label htmlFor="adv-cpf">CPF</Label>
                <Input
                  id="adv-cpf"
                  value={advogadoForm.cpf}
                  onChange={(e) =>
                    setAdvogadoForm({ ...advogadoForm, cpf: e.target.value.replace(/\D/g, '') })
                  }
                  placeholder="00000000000"
                  maxLength={11}
                />
              </div>
              <div>
                <Label htmlFor="adv-oab">OAB Número</Label>
                <Input
                  id="adv-oab"
                  value={advogadoForm.oabNumero}
                  onChange={(e) =>
                    setAdvogadoForm({ ...advogadoForm, oabNumero: e.target.value.replace(/\D/g, '') })
                  }
                  placeholder="123456"
                />
              </div>
              <div>
                <Label htmlFor="adv-uf">OAB Estado</Label>
                <Select
                  value={advogadoForm.oabUf}
                  onValueChange={(value) => setAdvogadoForm({ ...advogadoForm, oabUf: value })}
                >
                  <SelectTrigger id="adv-uf">
                    <SelectValue placeholder="Selecione" />
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

            <div>
              <Label htmlFor="adv-escritorio">Escritório</Label>
              <Select
                value={advogadoForm.escritorioId}
                onValueChange={(value) =>
                  setAdvogadoForm({ ...advogadoForm, escritorioId: value, createNewFirm: false })
                }
              >
                <SelectTrigger id="adv-escritorio">
                  <SelectValue placeholder="Selecione um escritório ou deixe em branco para criar solo" />
                </SelectTrigger>
                <SelectContent>
                  {escritorios.map((esc) => (
                    <SelectItem key={esc.id} value={esc.id}>
                      {esc.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground mt-1">
                Se nenhum escritório for selecionado, será criado um escritório com o nome do advogado
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAdvogadoDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCreateAdvogado}>Criar Advogado</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Lawyer Detail Modal */}
      <LawyerDetailModal
        lawyerId={selectedLawyerId}
        onClose={() => setSelectedLawyerId(null)}
        onUpdate={loadData}
      />
    </div>
  );
}

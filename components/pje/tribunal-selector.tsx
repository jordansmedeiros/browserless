/**
 * Tribunal Selector Component
 * Seletor hierárquico e amigável de tribunais para credenciais
 */

'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Search, CheckSquare, Square } from 'lucide-react';
import type { TribunalConfigConstant } from '@/lib/constants/tribunais';
import type { Regiao } from '@/lib/types/tribunal';

/**
 * IndeterminateCheckbox - Checkbox com suporte ao estado indeterminado
 * O estado `indeterminate` é uma propriedade DOM, não um atributo HTML
 */
interface IndeterminateCheckboxProps extends React.ComponentPropsWithoutRef<typeof Checkbox> {
  indeterminate?: boolean;
}

function IndeterminateCheckbox({ indeterminate, ...props }: IndeterminateCheckboxProps) {
  const ref = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (ref.current) {
      (ref.current as any).indeterminate = indeterminate ?? false;
    }
  }, [indeterminate]);

  return <Checkbox ref={ref} {...props} />;
}

interface TribunalSelectorProps {
  /** Lista de todos os tribunais disponíveis */
  tribunais: TribunalConfigConstant[];
  /** IDs dos tribunais selecionados */
  selectedIds: string[];
  /** Callback quando a seleção muda */
  onChange: (selectedIds: string[]) => void;
}

export function TribunalSelector({ tribunais, selectedIds, onChange }: TribunalSelectorProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRegion, setSelectedRegion] = useState<Regiao | 'Todas'>('Todas');

  // Determina o tipo de tribunal baseado no código
  const getTipoTribunal = (codigo: string): 'TRT' | 'TJ' | 'TRF' | 'Superior' => {
    if (codigo.startsWith('TRT')) return 'TRT';
    if (codigo.startsWith('TJ')) return 'TJ';
    if (codigo.startsWith('TRF')) return 'TRF';
    return 'Superior';
  };

  // Agrupa tribunais primeiro por tipo, depois por código
  const tribunaisAgrupadosPorTipo = useMemo(() => {
    // Primeiro agrupa por código
    const gruposPorCodigo = new Map<string, TribunalConfigConstant[]>();

    tribunais.forEach((t) => {
      const existing = gruposPorCodigo.get(t.codigo) || [];
      gruposPorCodigo.set(t.codigo, [...existing, t]);
    });

    // Depois agrupa por tipo
    const tipos: Record<string, Array<{ codigo: string; configs: TribunalConfigConstant[]; info: TribunalConfigConstant }>> = {
      TRT: [],
      TJ: [],
      TRF: [],
      Superior: [],
    };

    Array.from(gruposPorCodigo.entries()).forEach(([codigo, configs]) => {
      const tipo = getTipoTribunal(codigo);
      tipos[tipo].push({
        codigo,
        configs: configs.sort((a, b) => a.grau.localeCompare(b.grau)),
        info: configs[0],
      });
    });

    // Ordena cada tipo
    Object.keys(tipos).forEach((tipo) => {
      tipos[tipo].sort((a, b) => {
        const numA = parseInt(a.codigo.replace(/\D/g, ''), 10);
        const numB = parseInt(b.codigo.replace(/\D/g, ''), 10);
        return numA - numB;
      });
    });

    return tipos;
  }, [tribunais]);

  // Filtro por busca e região - aplica filtros em cada tipo
  const tribunaisFiltrados = useMemo(() => {
    const filtrados: typeof tribunaisAgrupadosPorTipo = {
      TRT: [],
      TJ: [],
      TRF: [],
      Superior: [],
    };

    Object.entries(tribunaisAgrupadosPorTipo).forEach(([tipo, grupos]) => {
      filtrados[tipo as keyof typeof filtrados] = grupos.filter((grupo) => {
        const matchSearch =
          searchTerm === '' ||
          grupo.codigo.toLowerCase().includes(searchTerm.toLowerCase()) ||
          grupo.info.nomeCompleto.toLowerCase().includes(searchTerm.toLowerCase()) ||
          grupo.info.uf.toLowerCase().includes(searchTerm.toLowerCase()) ||
          grupo.info.cidadeSede.toLowerCase().includes(searchTerm.toLowerCase());

        const matchRegion = selectedRegion === 'Todas' || grupo.info.regiao === selectedRegion;

        return matchSearch && matchRegion;
      });
    });

    return filtrados;
  }, [tribunaisAgrupadosPorTipo, searchTerm, selectedRegion]);

  // Regiões únicas
  const regioes: Regiao[] = ['Norte', 'Nordeste', 'Centro-Oeste', 'Sudeste', 'Sul'];

  // Funções de seleção
  const handleSelectAll = () => {
    const allIds = tribunais.map((t) => t.id);
    onChange(allIds);
  };

  const handleClearAll = () => {
    onChange([]);
  };

  const handleToggleTribunal = (configs: TribunalConfigConstant[]) => {
    const tribunalIds = configs.map((c) => c.id);
    const allSelected = tribunalIds.every((id) => selectedIds.includes(id));

    if (allSelected) {
      // Desmarca todos os graus deste tribunal
      onChange(selectedIds.filter((id) => !tribunalIds.includes(id)));
    } else {
      // Marca todos os graus deste tribunal
      const newIds = [...new Set([...selectedIds, ...tribunalIds])];
      onChange(newIds);
    }
  };

  const handleToggleGrau = (id: string) => {
    if (selectedIds.includes(id)) {
      onChange(selectedIds.filter((sid) => sid !== id));
    } else {
      onChange([...selectedIds, id]);
    }
  };

  // Verifica estado de seleção de um tribunal
  const getTribunalSelectionState = (configs: TribunalConfigConstant[]) => {
    const tribunalIds = configs.map((c) => c.id);
    const selectedCount = tribunalIds.filter((id) => selectedIds.includes(id)).length;

    if (selectedCount === 0) return 'none';
    if (selectedCount === tribunalIds.length) return 'all';
    return 'partial';
  };

  const totalSelecionados = selectedIds.length;
  const totalDisponiveis = tribunais.length;

  return (
    <div className="space-y-4">
      {/* Header com contador e ações */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Label>Tribunais</Label>
          <Badge variant="secondary">
            {totalSelecionados} de {totalDisponiveis} selecionados
          </Badge>
        </div>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleSelectAll}
            disabled={totalSelecionados === totalDisponiveis}
          >
            <CheckSquare className="mr-2 h-4 w-4" />
            Selecionar Todos
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleClearAll}
            disabled={totalSelecionados === 0}
          >
            <Square className="mr-2 h-4 w-4" />
            Limpar
          </Button>
        </div>
      </div>

      {/* Busca */}
      <div className="relative">
        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por TRT, região, UF ou cidade..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Filtro por região */}
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant={selectedRegion === 'Todas' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setSelectedRegion('Todas')}
        >
          Todas
        </Button>
        {regioes.map((regiao) => (
          <Button
            key={regiao}
            type="button"
            variant={selectedRegion === regiao ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedRegion(regiao)}
          >
            {regiao}
          </Button>
        ))}
      </div>

      {/* Lista de tribunais agrupados por tipo */}
      <div className="rounded-md border">
        <Accordion type="multiple" className="w-full">
          {/* Tribunais Regionais do Trabalho */}
          {tribunaisFiltrados.TRT.length > 0 && (
            <AccordionItem value="trt">
              <AccordionTrigger className="px-4 hover:no-underline">
                <div className="flex items-center gap-2">
                  <span className="font-semibold">Tribunais Regionais do Trabalho</span>
                  <Badge variant="secondary">{tribunaisFiltrados.TRT.length}</Badge>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="max-h-[250px] overflow-y-auto divide-y">
                  {tribunaisFiltrados.TRT.map((grupo) => {
                    const selectionState = getTribunalSelectionState(grupo.configs);
                    return (
                      <div key={grupo.codigo} className="flex items-center gap-4 px-4 py-3 hover:bg-accent">
                        <IndeterminateCheckbox
                          checked={selectionState === 'all'}
                          indeterminate={selectionState === 'partial'}
                          onCheckedChange={() => handleToggleTribunal(grupo.configs)}
                        />
                        <div className="flex items-center gap-2 min-w-[180px]">
                          <span className="font-semibold">{grupo.codigo}</span>
                          <Badge variant="outline" className="text-xs">{grupo.info.uf}</Badge>
                          <Badge variant="secondary" className="text-xs">{grupo.info.regiao}</Badge>
                        </div>
                        <div className="flex items-center gap-4 ml-auto">
                          {grupo.configs.map((config) => (
                            <div key={config.id} className="flex items-center gap-2">
                              <Checkbox
                                id={`tc-${config.id}`}
                                checked={selectedIds.includes(config.id)}
                                onCheckedChange={() => handleToggleGrau(config.id)}
                              />
                              <label htmlFor={`tc-${config.id}`} className="text-sm font-medium cursor-pointer whitespace-nowrap">
                                {config.grau === '1g' ? '1º Grau' : '2º Grau'}
                              </label>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </AccordionContent>
            </AccordionItem>
          )}

          {/* Tribunais de Justiça */}
          {tribunaisFiltrados.TJ.length > 0 && (
            <AccordionItem value="tj">
              <AccordionTrigger className="px-4 hover:no-underline">
                <div className="flex items-center gap-2">
                  <span className="font-semibold">Tribunais de Justiça</span>
                  <Badge variant="secondary">{tribunaisFiltrados.TJ.length}</Badge>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="max-h-[250px] overflow-y-auto divide-y">
                  {tribunaisFiltrados.TJ.map((grupo) => {
                    const selectionState = getTribunalSelectionState(grupo.configs);
                    return (
                      <div key={grupo.codigo} className="flex items-center gap-4 px-4 py-3 hover:bg-accent">
                        <IndeterminateCheckbox
                          checked={selectionState === 'all'}
                          indeterminate={selectionState === 'partial'}
                          onCheckedChange={() => handleToggleTribunal(grupo.configs)}
                        />
                        <div className="flex items-center gap-2 min-w-[180px]">
                          <span className="font-semibold">{grupo.codigo}</span>
                          <Badge variant="outline" className="text-xs">{grupo.info.uf}</Badge>
                          <Badge variant="secondary" className="text-xs">{grupo.info.regiao}</Badge>
                        </div>
                        <div className="flex items-center gap-4 ml-auto">
                          {grupo.configs.map((config) => (
                            <div key={config.id} className="flex items-center gap-2">
                              <Checkbox
                                id={`tc-${config.id}`}
                                checked={selectedIds.includes(config.id)}
                                onCheckedChange={() => handleToggleGrau(config.id)}
                              />
                              <label htmlFor={`tc-${config.id}`} className="text-sm font-medium cursor-pointer whitespace-nowrap">
                                {config.grau === '1g' ? '1º Grau' : '2º Grau'}
                              </label>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </AccordionContent>
            </AccordionItem>
          )}

          {/* Tribunais Regionais Federais */}
          {tribunaisFiltrados.TRF.length > 0 && (
            <AccordionItem value="trf">
              <AccordionTrigger className="px-4 hover:no-underline">
                <div className="flex items-center gap-2">
                  <span className="font-semibold">Tribunais Regionais Federais</span>
                  <Badge variant="secondary">{tribunaisFiltrados.TRF.length}</Badge>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="max-h-[250px] overflow-y-auto divide-y">
                  {tribunaisFiltrados.TRF.map((grupo) => {
                    const selectionState = getTribunalSelectionState(grupo.configs);
                    return (
                      <div key={grupo.codigo} className="flex items-center gap-4 px-4 py-3 hover:bg-accent">
                        <IndeterminateCheckbox
                          checked={selectionState === 'all'}
                          indeterminate={selectionState === 'partial'}
                          onCheckedChange={() => handleToggleTribunal(grupo.configs)}
                        />
                        <div className="flex items-center gap-2 min-w-[180px]">
                          <span className="font-semibold">{grupo.codigo}</span>
                          <Badge variant="outline" className="text-xs">{grupo.info.uf}</Badge>
                          <Badge variant="secondary" className="text-xs">{grupo.info.regiao}</Badge>
                        </div>
                        <div className="flex items-center gap-4 ml-auto">
                          {grupo.configs.map((config) => (
                            <div key={config.id} className="flex items-center gap-2">
                              <Checkbox
                                id={`tc-${config.id}`}
                                checked={selectedIds.includes(config.id)}
                                onCheckedChange={() => handleToggleGrau(config.id)}
                              />
                              <label htmlFor={`tc-${config.id}`} className="text-sm font-medium cursor-pointer whitespace-nowrap">
                                {config.grau === '1g' ? '1º Grau' : '2º Grau'}
                              </label>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </AccordionContent>
            </AccordionItem>
          )}

          {/* Tribunais Superiores */}
          {tribunaisFiltrados.Superior.length > 0 && (
            <AccordionItem value="superior">
              <AccordionTrigger className="px-4 hover:no-underline">
                <div className="flex items-center gap-2">
                  <span className="font-semibold">Tribunais Superiores</span>
                  <Badge variant="secondary">{tribunaisFiltrados.Superior.length}</Badge>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="max-h-[250px] overflow-y-auto divide-y">
                  {tribunaisFiltrados.Superior.map((grupo) => {
                    const selectionState = getTribunalSelectionState(grupo.configs);
                    return (
                      <div key={grupo.codigo} className="flex items-center gap-4 px-4 py-3 hover:bg-accent">
                        <IndeterminateCheckbox
                          checked={selectionState === 'all'}
                          indeterminate={selectionState === 'partial'}
                          onCheckedChange={() => handleToggleTribunal(grupo.configs)}
                        />
                        <div className="flex items-center gap-2 min-w-[180px]">
                          <span className="font-semibold">{grupo.codigo}</span>
                          <Badge variant="outline" className="text-xs">{grupo.info.uf}</Badge>
                          <Badge variant="secondary" className="text-xs">{grupo.info.regiao}</Badge>
                        </div>
                        <div className="flex items-center gap-4 ml-auto">
                          {grupo.configs.map((config) => (
                            <div key={config.id} className="flex items-center gap-2">
                              <Checkbox
                                id={`tc-${config.id}`}
                                checked={selectedIds.includes(config.id)}
                                onCheckedChange={() => handleToggleGrau(config.id)}
                              />
                              <label htmlFor={`tc-${config.id}`} className="text-sm font-medium cursor-pointer whitespace-nowrap">
                                {config.grau === '1g' ? '1º Grau' : '2º Grau'}
                              </label>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </AccordionContent>
            </AccordionItem>
          )}
        </Accordion>

        {/* Mensagem quando não há tribunais após filtro */}
        {Object.values(tribunaisFiltrados).every((arr) => arr.length === 0) && (
          <div className="py-12 text-center text-sm text-muted-foreground">
            Nenhum tribunal encontrado
          </div>
        )}
      </div>

      {/* Resumo de seleção */}
      {totalSelecionados > 0 && (
        <div className="text-sm text-muted-foreground">
          {totalSelecionados === totalDisponiveis ? (
            <span className="font-medium text-foreground">Todos os tribunais selecionados</span>
          ) : (
            <span>
              {totalSelecionados} {totalSelecionados === 1 ? 'tribunal selecionado' : 'tribunais selecionados'}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

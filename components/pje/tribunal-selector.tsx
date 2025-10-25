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
import { Search, CheckSquare, Square, ChevronDown, ChevronRight } from 'lucide-react';
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
      ref.current.indeterminate = indeterminate ?? false;
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

  // Agrupa tribunais por código (TRT1, TRT2, etc)
  const tribunaisAgrupados = useMemo(() => {
    const grupos = new Map<string, TribunalConfigConstant[]>();

    tribunais.forEach((t) => {
      const existing = grupos.get(t.codigo) || [];
      grupos.set(t.codigo, [...existing, t]);
    });

    // Ordena por número do TRT
    return Array.from(grupos.entries())
      .sort((a, b) => {
        const numA = parseInt(a[0].replace('TRT', ''), 10);
        const numB = parseInt(b[0].replace('TRT', ''), 10);
        return numA - numB;
      })
      .map(([codigo, configs]) => ({
        codigo,
        configs: configs.sort((a, b) => a.grau.localeCompare(b.grau)),
        info: configs[0], // Usa info do primeiro para metadados comuns
      }));
  }, [tribunais]);

  // Filtro por busca e região
  const tribunaisFiltrados = useMemo(() => {
    return tribunaisAgrupados.filter((grupo) => {
      const matchSearch =
        searchTerm === '' ||
        grupo.codigo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        grupo.info.nomeCompleto.toLowerCase().includes(searchTerm.toLowerCase()) ||
        grupo.info.uf.toLowerCase().includes(searchTerm.toLowerCase()) ||
        grupo.info.cidadeSede.toLowerCase().includes(searchTerm.toLowerCase());

      const matchRegion = selectedRegion === 'Todas' || grupo.info.regiao === selectedRegion;

      return matchSearch && matchRegion;
    });
  }, [tribunaisAgrupados, searchTerm, selectedRegion]);

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

      {/* Lista de tribunais com scroll */}
      <div className="max-h-[400px] overflow-y-auto rounded-md border">
        <Accordion type="multiple" className="w-full">
          {tribunaisFiltrados.map((grupo) => {
            const selectionState = getTribunalSelectionState(grupo.configs);

            return (
              <AccordionItem key={grupo.codigo} value={grupo.codigo}>
                {/* Reorganizado: Checkbox fora do AccordionTrigger para evitar nested buttons */}
                <div className="flex items-center hover:bg-accent">
                  <div className="flex items-center px-4 py-4 gap-3">
                    <IndeterminateCheckbox
                      checked={selectionState === 'all'}
                      indeterminate={selectionState === 'partial'}
                      onCheckedChange={() => handleToggleTribunal(grupo.configs)}
                      onClick={(e) => e.stopPropagation()}
                    />
                  </div>
                  <AccordionTrigger className="flex-1 py-4 pr-4 hover:no-underline">
                    <div className="flex items-center gap-3 flex-1">
                      <div className="flex flex-col items-start flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">{grupo.codigo}</span>
                          <Badge variant="outline" className="text-xs">
                            {grupo.info.uf}
                          </Badge>
                          <Badge variant="secondary" className="text-xs">
                            {grupo.info.regiao}
                          </Badge>
                        </div>
                        <span className="text-sm text-muted-foreground truncate max-w-full">
                          {grupo.info.nomeCompleto} • {grupo.info.cidadeSede}
                        </span>
                      </div>
                    </div>
                  </AccordionTrigger>
                </div>
                <AccordionContent className="px-4 pb-4">
                  <div className="space-y-2 pl-8">
                    {grupo.configs.map((config) => (
                      <div key={config.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={`tc-${config.id}`}
                          checked={selectedIds.includes(config.id)}
                          onCheckedChange={() => handleToggleGrau(config.id)}
                        />
                        <label
                          htmlFor={`tc-${config.id}`}
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                        >
                          {config.grau === '1g' ? '1º Grau' : '2º Grau'}
                        </label>
                      </div>
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
            );
          })}
        </Accordion>

        {tribunaisFiltrados.length === 0 && (
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

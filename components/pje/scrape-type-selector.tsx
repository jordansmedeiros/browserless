/**
 * Scrape Type Selector Component
 * Selector for scraping types and sub-types
 */

'use client';

import { useState } from 'react';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { FileText, Clock, Archive, Calendar, Info } from 'lucide-react';
import type { ScrapeType, ScrapeSubType } from '@/lib/types/scraping';

interface ScrapeTypeSelectorProps {
  /** Selected scrape type */
  selectedType: ScrapeType | null;
  /** Selected sub-types (for Pendentes) */
  selectedSubTypes: ScrapeSubType[];
  /** Callback when type changes */
  onTypeChange: (type: ScrapeType) => void;
  /** Callback when sub-types change */
  onSubTypesChange: (subTypes: ScrapeSubType[]) => void;
}

const SCRAPE_TYPES = [
  {
    value: 'acervo_geral' as ScrapeType,
    label: 'Acervo Geral',
    description: 'Todos os processos do acervo geral do advogado',
    icon: FileText,
    estimatedTime: '5-15 min',
  },
  {
    value: 'pendentes' as ScrapeType,
    label: 'Pendentes de Manifestação',
    description: 'Processos pendentes que necessitam atenção',
    icon: Clock,
    estimatedTime: '3-10 min',
    hasSubTypes: true,
  },
  {
    value: 'arquivados' as ScrapeType,
    label: 'Processos Arquivados',
    description: 'Processos arquivados no sistema',
    icon: Archive,
    estimatedTime: '5-15 min',
  },
  {
    value: 'minha_pauta' as ScrapeType,
    label: 'Minha Pauta',
    description: 'Audiências agendadas (próximos 30 dias)',
    icon: Calendar,
    estimatedTime: '1-3 min',
  },
];

const SUB_TYPES = [
  {
    value: 'com_dado_ciencia' as ScrapeSubType,
    label: 'Com Dado Ciência',
    description: 'Processos pendentes com prazo em andamento',
  },
  {
    value: 'sem_prazo' as ScrapeSubType,
    label: 'Sem Prazo',
    description: 'Processos pendentes sem prazo definido',
  },
];

export function ScrapeTypeSelector({
  selectedType,
  selectedSubTypes,
  onTypeChange,
  onSubTypesChange,
}: ScrapeTypeSelectorProps) {
  const handleSubTypeToggle = (subType: ScrapeSubType) => {
    if (selectedSubTypes.includes(subType)) {
      onSubTypesChange(selectedSubTypes.filter((st) => st !== subType));
    } else {
      onSubTypesChange([...selectedSubTypes, subType]);
    }
  };

  const showSubTypes = selectedType === 'pendentes';
  const hasSubTypeError = showSubTypes && selectedSubTypes.length === 0;

  return (
    <div className="space-y-4">
      <div>
        <Label>Tipo de Raspagem</Label>
        <p className="text-sm text-muted-foreground">
          Selecione o tipo de dados que deseja raspar dos tribunais
        </p>
      </div>

      <RadioGroup
        value={selectedType || ''}
        onValueChange={(value) => onTypeChange(value as ScrapeType)}
      >
        <div className="grid gap-4">
          {SCRAPE_TYPES.map((type) => {
            const Icon = type.icon;
            const isSelected = selectedType === type.value;

            return (
              <div key={type.value}>
                <label
                  htmlFor={`scrape-type-${type.value}`}
                  className={`flex cursor-pointer rounded-lg border-2 transition-colors ${
                    isSelected
                      ? 'border-primary bg-primary/5'
                      : 'border-muted hover:border-primary/50 hover:bg-accent'
                  }`}
                >
                  <div className="flex flex-1 items-start gap-4 p-4">
                    <RadioGroupItem
                      id={`scrape-type-${type.value}`}
                      value={type.value}
                      className="mt-1"
                    />
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <Icon className="h-4 w-4" />
                        <p className="font-medium leading-none">{type.label}</p>
                      </div>
                      <p className="text-sm text-muted-foreground">{type.description}</p>
                      <p className="text-xs text-muted-foreground">
                        ⏱️ Tempo estimado por tribunal: {type.estimatedTime}
                      </p>
                    </div>
                  </div>
                </label>

                {/* Sub-types para Pendentes */}
                {showSubTypes && type.value === 'pendentes' && (
                  <Card className="mt-2 ml-8 mr-0">
                    <CardContent className="pt-4">
                      <div className="space-y-3">
                        <div>
                          <Label>Sub-tipos (selecione pelo menos um)</Label>
                          <CardDescription>
                            Para "Pendentes de Manifestação", escolha quais tipos deseja raspar
                          </CardDescription>
                        </div>

                        {SUB_TYPES.map((subType) => (
                          <div key={subType.value} className="flex items-start space-x-3">
                            <Checkbox
                              id={`subtype-${subType.value}`}
                              checked={selectedSubTypes.includes(subType.value)}
                              onCheckedChange={() => handleSubTypeToggle(subType.value)}
                            />
                            <div className="flex-1 space-y-1">
                              <label
                                htmlFor={`subtype-${subType.value}`}
                                className="text-sm font-medium leading-none cursor-pointer peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                              >
                                {subType.label}
                              </label>
                              <p className="text-sm text-muted-foreground">
                                {subType.description}
                              </p>
                            </div>
                          </div>
                        ))}

                        {hasSubTypeError && (
                          <Alert variant="destructive">
                            <Info className="h-4 w-4" />
                            <AlertDescription>
                              Selecione pelo menos um sub-tipo para continuar
                            </AlertDescription>
                          </Alert>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            );
          })}
        </div>
      </RadioGroup>
    </div>
  );
}

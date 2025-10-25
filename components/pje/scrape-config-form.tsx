/**
 * Scrape Configuration Form Component
 * Form for configuring and starting scraping jobs
 */

'use client';

import { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Loader2, Play, AlertCircle, CheckCircle2, Clock } from 'lucide-react';
import { TribunalSelector } from './tribunal-selector';
import { ScrapeTypeSelector } from './scrape-type-selector';
import { createScrapeJobAction } from '@/app/actions/pje';
import type { TribunalConfigConstant } from '@/lib/constants/tribunais';
import type { ScrapeType, ScrapeSubType } from '@/lib/types/scraping';

interface ScrapeConfigFormProps {
  /** All available tribunals */
  tribunais: TribunalConfigConstant[];
  /** Callback when job is created successfully */
  onJobCreated?: (jobId: string) => void;
  /** Callback when form is reset */
  onReset?: () => void;
}

export function ScrapeConfigForm({ tribunais, onJobCreated, onReset }: ScrapeConfigFormProps) {
  // Form state
  const [selectedTribunalIds, setSelectedTribunalIds] = useState<string[]>([]);
  const [selectedType, setSelectedType] = useState<ScrapeType | null>(null);
  const [selectedSubTypes, setSelectedSubTypes] = useState<ScrapeSubType[]>([]);

  // UI state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Clear message after 5 seconds
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  // Validation
  const isValid = useMemo(() => {
    if (selectedTribunalIds.length === 0) return false;
    if (!selectedType) return false;
    if (selectedType === 'pendentes' && selectedSubTypes.length === 0) return false;
    return true;
  }, [selectedTribunalIds, selectedType, selectedSubTypes]);

  // Estimated time calculation
  const estimatedTime = useMemo(() => {
    if (selectedTribunalIds.length === 0 || !selectedType) return null;

    const timePerTribunal: Record<ScrapeType, number> = {
      acervo_geral: 10, // 10 minutes
      pendentes: selectedSubTypes.length * 6.5, // 6.5 min per subtype
      arquivados: 10,
      minha_pauta: 2,
    };

    const minutesPerTribunal = timePerTribunal[selectedType];
    const totalMinutes = minutesPerTribunal * selectedTribunalIds.length;

    return Math.ceil(totalMinutes);
  }, [selectedTribunalIds.length, selectedType, selectedSubTypes.length]);

  const formatEstimatedTime = (minutes: number): string => {
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}min`;
  };

  // Form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isValid) {
      setMessage({ type: 'error', text: 'Por favor, preencha todos os campos obrigatórios' });
      return;
    }

    setIsSubmitting(true);
    setMessage(null);

    try {
      const result = await createScrapeJobAction({
        tribunalConfigIds: selectedTribunalIds,
        scrapeType: selectedType!,
        scrapeSubType: selectedSubTypes[0],
      });

      if (result.success && result.data) {
        setMessage({
          type: 'success',
          text: `Job criado com sucesso! ${selectedTribunalIds.length} tribunal(is) na fila.`,
        });

        // Reset form
        setSelectedTribunalIds([]);
        setSelectedType(null);
        setSelectedSubTypes([]);

        // Callback
        onJobCreated?.(result.data.jobId);
      } else {
        setMessage({
          type: 'error',
          text: result.error || 'Erro ao criar job de raspagem',
        });
      }
    } catch (error) {
      console.error('Error creating scrape job:', error);
      setMessage({
        type: 'error',
        text: 'Erro inesperado ao criar job',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setSelectedTribunalIds([]);
    setSelectedType(null);
    setSelectedSubTypes([]);
    setMessage(null);
    onReset?.();
  };

  // Get scrape type label
  const getScrapeTypeLabel = () => {
    switch (selectedType) {
      case 'acervo_geral':
        return 'Acervo Geral';
      case 'pendentes':
        return 'Pendentes de Manifestação';
      case 'arquivados':
        return 'Processos Arquivados';
      case 'minha_pauta':
        return 'Minha Pauta';
      default:
        return '';
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Message */}
      {message && (
        <Alert variant={message.type === 'error' ? 'destructive' : 'default'}>
          {message.type === 'success' ? (
            <CheckCircle2 className="h-4 w-4" />
          ) : (
            <AlertCircle className="h-4 w-4" />
          )}
          <AlertDescription>{message.text}</AlertDescription>
        </Alert>
      )}

      {/* Tribunal Selection */}
      <Card>
        <CardHeader>
          <CardTitle>1. Selecionar Tribunais</CardTitle>
          <CardDescription>
            Escolha um ou mais tribunais para raspar
          </CardDescription>
        </CardHeader>
        <CardContent>
          <TribunalSelector
            tribunais={tribunais}
            selectedIds={selectedTribunalIds}
            onChange={setSelectedTribunalIds}
          />
        </CardContent>
      </Card>

      {/* Scrape Type Selection */}
      <Card>
        <CardHeader>
          <CardTitle>2. Selecionar Tipo de Raspagem</CardTitle>
          <CardDescription>
            Defina o tipo de dados a serem coletados
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ScrapeTypeSelector
            selectedType={selectedType}
            selectedSubTypes={selectedSubTypes}
            onTypeChange={setSelectedType}
            onSubTypesChange={setSelectedSubTypes}
          />
        </CardContent>
      </Card>

      {/* Configuration Summary */}
      {isValid && (
        <Card className="border-primary">
          <CardHeader>
            <CardTitle>Resumo da Configuração</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Tribunais</p>
                <p className="text-2xl font-bold">{selectedTribunalIds.length}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Tipo de Raspagem</p>
                <p className="text-lg font-semibold">{getScrapeTypeLabel()}</p>
              </div>
            </div>

            {selectedType === 'pendentes' && selectedSubTypes.length > 0 && (
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Sub-tipos</p>
                <div className="flex gap-2">
                  {selectedSubTypes.map((subType) => (
                    <span
                      key={subType}
                      className="inline-flex items-center rounded-md bg-primary/10 px-2 py-1 text-xs font-medium text-primary"
                    >
                      {subType === 'com_dado_ciencia' ? 'Com Dado Ciência' : 'Sem Prazo'}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {estimatedTime && (
              <div className="flex items-center gap-2 rounded-md bg-muted p-3">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Tempo estimado</p>
                  <p className="text-sm text-muted-foreground">
                    Aproximadamente {formatEstimatedTime(estimatedTime)}
                  </p>
                </div>
              </div>
            )}

            <Separator />

            <div className="flex justify-between gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleReset}
                disabled={isSubmitting}
              >
                Limpar
              </Button>
              <Button type="submit" disabled={!isValid || isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Criando Job...
                  </>
                ) : (
                  <>
                    <Play className="mr-2 h-4 w-4" />
                    Iniciar Raspagem
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Validation message */}
      {!isValid && (selectedTribunalIds.length > 0 || selectedType) && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {selectedTribunalIds.length === 0 && 'Selecione pelo menos um tribunal'}
            {selectedTribunalIds.length > 0 && !selectedType && 'Selecione um tipo de raspagem'}
            {selectedType === 'pendentes' &&
              selectedSubTypes.length === 0 &&
              'Selecione pelo menos um sub-tipo para Pendentes'}
          </AlertDescription>
        </Alert>
      )}
    </form>
  );
}

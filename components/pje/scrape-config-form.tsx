/**
 * Scrape Configuration Form Component
 * Wizard-based form for configuring and starting scraping jobs
 */

'use client';

import { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { WizardContainer } from '@/components/ui/wizard-container';
import { WizardStep } from '@/components/ui/wizard-step';
import { WizardNavigation } from '@/components/ui/wizard-navigation';
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
  /** Callback when form state changes */
  onFormChange?: () => void;
}

export function ScrapeConfigForm({ tribunais, onJobCreated, onReset, onFormChange }: ScrapeConfigFormProps) {
  // Wizard state
  const [currentStep, setCurrentStep] = useState(1);

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

  // Notify parent of form changes
  useEffect(() => {
    if (selectedTribunalIds.length > 0 || selectedType !== null) {
      onFormChange?.();
    }
  }, [selectedTribunalIds, selectedType, onFormChange]);

  // Step validation
  const stepValidation = useMemo(() => {
    return {
      1: selectedTribunalIds.length > 0, // Step 1: At least one tribunal
      2: selectedType !== null && (selectedType !== 'pendentes' || selectedSubTypes.length > 0), // Step 2: Type selected and subtypes if needed
    };
  }, [selectedTribunalIds, selectedType, selectedSubTypes]);

  // Overall validation
  const isValid = useMemo(() => {
    return Object.values(stepValidation).every((valid) => valid);
  }, [stepValidation]);

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
  const handleSubmit = async () => {
    if (!isValid) {
      setMessage({ type: 'error', text: 'Por favor, preencha todos os campos obrigatórios' });
      return;
    }

    setIsSubmitting(true);
    setMessage(null);

    try {
      console.log('[ScrapeConfigForm] Enviando requisição com:', {
        tribunalConfigIds: selectedTribunalIds,
        scrapeType: selectedType,
        scrapeSubType: selectedSubTypes[0],
      });

      const result = await createScrapeJobAction({
        tribunalConfigIds: selectedTribunalIds,
        scrapeType: selectedType!,
        scrapeSubType: selectedSubTypes[0],
      });

      console.log('[ScrapeConfigForm] Resultado da action:', result);

      if (result.success && result.data) {
        console.log('[ScrapeConfigForm] Job criado com sucesso:', result.data.jobId);
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
        console.error('[ScrapeConfigForm] Erro ao criar job:', result.error);
        setMessage({
          type: 'error',
          text: result.error || 'Erro ao criar job de raspagem',
        });
      }
    } catch (error) {
      console.error('[ScrapeConfigForm] Erro inesperado:', error);
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
    <div className="space-y-6">
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

      {/* Wizard */}
      <WizardContainer
        currentStep={currentStep}
        totalSteps={2}
        onStepChange={setCurrentStep}
        stepValidation={stepValidation}
      >
        {/* Step 1: Tribunal Selection */}
        <WizardStep
          step={1}
          title="Selecionar Tribunais"
          description="Escolha um ou mais tribunais para raspar"
        >
          <div className="max-h-[400px] overflow-y-auto pr-2">
            <TribunalSelector
              tribunais={tribunais}
              selectedIds={selectedTribunalIds}
              onChange={setSelectedTribunalIds}
            />
          </div>

          {/* Step 1 Validation message */}
          {!stepValidation[1] && selectedTribunalIds.length === 0 && currentStep === 1 && (
            <Alert className="mt-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Selecione pelo menos um tribunal para continuar
              </AlertDescription>
            </Alert>
          )}
        </WizardStep>

        {/* Step 2: Configuration */}
        <WizardStep
          step={2}
          title="Configurar Raspagem"
          description="Defina o tipo de dados a serem coletados"
        >
          <div className="space-y-6">
            {/* Scrape Type Selection */}
            <div>
              <ScrapeTypeSelector
                selectedType={selectedType}
                selectedSubTypes={selectedSubTypes}
                onTypeChange={setSelectedType}
                onSubTypesChange={setSelectedSubTypes}
              />
            </div>

            {/* Step 2 Validation message */}
            {!stepValidation[2] && currentStep === 2 && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  {!selectedType && 'Selecione um tipo de raspagem'}
                  {selectedType === 'pendentes' &&
                    selectedSubTypes.length === 0 &&
                    'Selecione pelo menos um sub-tipo para Pendentes'}
                </AlertDescription>
              </Alert>
            )}

            {/* Configuration Summary */}
            {stepValidation[2] && (
              <>
                <Separator />
                <Card className="border-primary">
                  <CardHeader>
                    <CardTitle className="text-lg">Resumo da Configuração</CardTitle>
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
                  </CardContent>
                </Card>
              </>
            )}
          </div>
        </WizardStep>

        {/* Wizard Navigation */}
        <WizardNavigation
          submitLabel="Iniciar Raspagem"
          isSubmitting={isSubmitting}
          onSubmit={handleSubmit}
        />
      </WizardContainer>
    </div>
  );
}

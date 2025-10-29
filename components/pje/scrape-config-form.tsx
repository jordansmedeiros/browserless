/**
 * Scrape Configuration Form Component
 * Wizard-based form for configuring and starting scraping jobs
 */

'use client';

import { useState, useEffect, useMemo } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { WizardContainer } from '@/components/ui/wizard-container';
import { WizardStep } from '@/components/ui/wizard-step';
import { WizardNavigation } from '@/components/ui/wizard-navigation';
import { AlertCircle, CheckCircle2 } from 'lucide-react';
import { TribunalSelector } from './tribunal-selector';
import { ScrapeTypeSelector } from './scrape-type-selector';
import { CredentialSelector } from './credential-selector';
import { createScrapeJobAction } from '@/app/actions/pje';
import type { TribunalConfigConstant } from '@/lib/constants/tribunais';
import type { ScrapeType, ScrapeSubType } from '@/lib/types/scraping';
import type { CredencialWithRelations } from '@/lib/types';

interface ScrapeConfigFormProps {
  /** All available credentials */
  credentials: CredencialWithRelations[];
  /** All available tribunals */
  tribunais: TribunalConfigConstant[];
  /** Callback when job is created successfully */
  onJobCreated?: (jobId: string) => void;
  /** Callback when form is reset */
  onReset?: () => void;
  /** Callback when form state changes */
  onFormChange?: () => void;
}

export function ScrapeConfigForm({ credentials, tribunais, onJobCreated, onReset, onFormChange }: ScrapeConfigFormProps) {
  // Wizard state
  const [currentStep, setCurrentStep] = useState(1);

  // Form state
  const [selectedCredentialId, setSelectedCredentialId] = useState<string | null>(null);
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
    if (selectedCredentialId || selectedTribunalIds.length > 0 || selectedType !== null) {
      onFormChange?.();
    }
  }, [selectedCredentialId, selectedTribunalIds, selectedType, onFormChange]);

  // Step validation
  const stepValidation = useMemo(() => {
    return {
      1: selectedCredentialId !== null, // Step 1: Credential selected
      2: selectedTribunalIds.length > 0, // Step 2: At least one tribunal
      3: selectedType !== null && (selectedType !== 'pendentes' || selectedSubTypes.length > 0), // Step 3: Type selected and subtypes if needed
    };
  }, [selectedCredentialId, selectedTribunalIds, selectedType, selectedSubTypes]);

  // Overall validation
  const isValid = useMemo(() => {
    return Object.values(stepValidation).every((valid) => valid);
  }, [stepValidation]);

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
        credencialId: selectedCredentialId,
        tribunalConfigIds: selectedTribunalIds,
        scrapeType: selectedType,
        scrapeSubType: selectedSubTypes[0],
      });

      const result = await createScrapeJobAction({
        credencialId: selectedCredentialId!,
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
        setSelectedCredentialId(null);
        setSelectedTribunalIds([]);
        setSelectedType(null);
        setSelectedSubTypes([]);
        setCurrentStep(1);

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
    setSelectedCredentialId(null);
    setSelectedTribunalIds([]);
    setSelectedType(null);
    setSelectedSubTypes([]);
    setCurrentStep(1);
    setMessage(null);
    onReset?.();
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
        totalSteps={3}
        onStepChange={setCurrentStep}
        stepValidation={stepValidation}
      >
        {/* Step 1: Credential Selection */}
        <WizardStep step={1} title="Selecionar Credencial">
          <CredentialSelector
            credentials={credentials}
            selectedCredentialId={selectedCredentialId}
            onSelect={setSelectedCredentialId}
          />
        </WizardStep>

        {/* Step 2: Tribunal Selection */}
        <WizardStep step={2} title="Selecionar Tribunais">
          <TribunalSelector
            tribunais={tribunais}
            selectedIds={selectedTribunalIds}
            onChange={setSelectedTribunalIds}
            credentialId={selectedCredentialId}
          />
        </WizardStep>

        {/* Step 3: Configuration */}
        <WizardStep step={3} title="Configurar Raspagem">
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

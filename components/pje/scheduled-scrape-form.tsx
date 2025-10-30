/**
 * Scheduled Scrape Form Component
 * Wizard-based form for creating/editing scheduled scrapes
 */

'use client';

import { useState, useEffect, useMemo } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { WizardContainer } from '@/components/ui/wizard-container';
import { WizardStep } from '@/components/ui/wizard-step';
import { WizardNavigation } from '@/components/ui/wizard-navigation';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { TribunalSelector } from './tribunal-selector';
import { ScrapeTypeSelector } from './scrape-type-selector';
import { CredentialSelector } from './credential-selector';
import { ScheduleFrequencySelector } from './schedule-frequency-selector';
import { createScheduledScrapeAction, updateScheduledScrapeAction, getScheduledScrapeAction } from '@/app/actions/pje';
import { useCredentials } from '@/hooks';
import { frequencyConfigToCron, cronToFrequencyConfig } from '@/lib/utils/cron-helpers';
import type { TribunalConfigConstant } from '@/lib/constants/tribunais';
import type { ScrapeType, ScrapeSubType, ScheduleFrequencyConfig, ScheduleFrequencyType } from '@/lib/types/scraping';

interface ScheduledScrapeFormProps {
  tribunais: TribunalConfigConstant[];
  scheduleId?: string;
  onSuccess?: (scheduleId: string) => void;
  onCancel?: () => void;
}

export function ScheduledScrapeForm({ tribunais, scheduleId, onSuccess, onCancel }: ScheduledScrapeFormProps) {
  const { credentials, isLoading: loadingCredentials } = useCredentials();
  const isEditMode = !!scheduleId;

  // Wizard state
  const [currentStep, setCurrentStep] = useState(1);

  // Form state - Step 1
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  // Form state - Step 2
  const [selectedCredentialId, setSelectedCredentialId] = useState<string | null>(null);

  // Form state - Step 3
  const [selectedTribunalIds, setSelectedTribunalIds] = useState<string[]>([]);
  const [selectedType, setSelectedType] = useState<ScrapeType | null>(null);
  const [selectedSubTypes, setSelectedSubTypes] = useState<ScrapeSubType[]>([]);

  // Form state - Step 4
  const [frequency, setFrequency] = useState<ScheduleFrequencyConfig>({
    type: 'daily' as ScheduleFrequencyType,
    dailyTime: '09:00',
  });
  const [activeImmediately, setActiveImmediately] = useState(true);

  // UI state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingSchedule, setIsLoadingSchedule] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Load existing schedule if editing
  useEffect(() => {
    if (scheduleId) {
      setIsLoadingSchedule(true);
      getScheduledScrapeAction(scheduleId)
        .then((result) => {
          if (result.success && result.data) {
            const schedule = result.data;
            setName(schedule.name);
            setDescription(schedule.description || '');
            setSelectedCredentialId(schedule.credencialId);
            setSelectedTribunalIds(schedule.tribunalConfigIds as string[]);
            setSelectedType(schedule.scrapeType as ScrapeType);
            setSelectedSubTypes(schedule.scrapeSubType ? [schedule.scrapeSubType as ScrapeSubType] : []);

            // Convert cron to frequency config
            const freqConfig = cronToFrequencyConfig(schedule.cronExpression);
            if (freqConfig) {
              setFrequency(freqConfig);
            }
            setActiveImmediately(schedule.active);
          } else {
            setMessage({ type: 'error', text: result.error || 'Erro ao carregar agendamento' });
          }
        })
        .catch((error) => {
          console.error('[ScheduledScrapeForm] Error loading schedule:', error);
          setMessage({ type: 'error', text: 'Erro ao carregar agendamento' });
        })
        .finally(() => {
          setIsLoadingSchedule(false);
        });
    }
  }, [scheduleId]);

  // Clear message after 5 seconds
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  // Clear tribunal selection when credential changes
  useEffect(() => {
    setSelectedTribunalIds([]);
    setSelectedType(null);
    setSelectedSubTypes([]);
  }, [selectedCredentialId]);

  // Step validation
  const stepValidation = useMemo(() => {
    return {
      1: name.trim().length >= 3,
      2: selectedCredentialId !== null,
      3: selectedTribunalIds.length > 0 && selectedType !== null && (selectedType !== 'pendentes' || selectedSubTypes.length > 0),
      4: true, // Frequency is always valid due to component validation
    };
  }, [name, selectedCredentialId, selectedTribunalIds, selectedType, selectedSubTypes]);

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
      // Convert frequency config to cron
      const cronExpression = frequencyConfigToCron(frequency);

      const input = {
        name: name.trim(),
        description: description.trim() || undefined,
        credencialId: selectedCredentialId!,
        tribunalConfigIds: selectedTribunalIds,
        scrapeType: selectedType!,
        scrapeSubType: selectedSubTypes[0],
        cronExpression,
        timezone: 'America/Sao_Paulo',
        active: activeImmediately,
      };

      let result;
      if (isEditMode && scheduleId) {
        result = await updateScheduledScrapeAction(scheduleId, input);
      } else {
        result = await createScheduledScrapeAction(input);
      }

      if (result.success) {
        setMessage({
          type: 'success',
          text: isEditMode ? 'Agendamento atualizado com sucesso!' : 'Agendamento criado com sucesso!',
        });

        // Reset form after success
        setTimeout(() => {
          handleReset();
          onSuccess?.(isEditMode ? scheduleId : result.data?.scheduleId || '');
        }, 1500);
      } else {
        setMessage({
          type: 'error',
          text: result.error || 'Erro ao salvar agendamento',
        });
      }
    } catch (error) {
      console.error('[ScheduledScrapeForm] Error:', error);
      setMessage({
        type: 'error',
        text: 'Erro inesperado ao salvar agendamento',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Reset form
  const handleReset = () => {
    setCurrentStep(1);
    setName('');
    setDescription('');
    setSelectedCredentialId(null);
    setSelectedTribunalIds([]);
    setSelectedType(null);
    setSelectedSubTypes([]);
    setFrequency({
      type: 'daily' as ScheduleFrequencyType,
      dailyTime: '09:00',
    });
    setActiveImmediately(true);
    setMessage(null);
  };

  if (isLoadingSchedule) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        <span className="ml-3 text-muted-foreground">Carregando agendamento...</span>
      </div>
    );
  }

  return (
    <WizardContainer>
      {/* Step 1: Basic Information */}
      <WizardStep stepNumber={1} currentStep={currentStep} title="Informações Básicas">
        <div className="space-y-4">
          <div>
            <Label htmlFor="schedule-name">
              Nome do Agendamento <span className="text-destructive">*</span>
            </Label>
            <Input
              id="schedule-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Raspagem Diária TRT3 - Pendentes"
              maxLength={100}
              className="mt-1"
            />
            <p className="text-xs text-muted-foreground mt-1">
              {name.length}/100 caracteres (mínimo 3)
            </p>
          </div>

          <div>
            <Label htmlFor="schedule-description">Descrição (opcional)</Label>
            <Textarea
              id="schedule-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descreva o propósito deste agendamento..."
              maxLength={500}
              rows={3}
              className="mt-1"
            />
            <p className="text-xs text-muted-foreground mt-1">
              {description.length}/500 caracteres
            </p>
          </div>
        </div>
      </WizardStep>

      {/* Step 2: Credential Selection */}
      <WizardStep stepNumber={2} currentStep={currentStep} title="Credencial">
        {loadingCredentials ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            <span className="ml-2 text-muted-foreground">Carregando credenciais...</span>
          </div>
        ) : credentials.length === 0 ? (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Nenhuma credencial cadastrada. Por favor, cadastre uma credencial primeiro.
            </AlertDescription>
          </Alert>
        ) : (
          <CredentialSelector
            credentials={credentials}
            selectedCredentialId={selectedCredentialId}
            onSelectCredential={setSelectedCredentialId}
          />
        )}
      </WizardStep>

      {/* Step 3: Tribunals and Type */}
      <WizardStep stepNumber={3} currentStep={currentStep} title="Tribunais e Tipo">
        <div className="space-y-6">
          <div>
            <h3 className="text-sm font-medium mb-3">Tribunais</h3>
            <TribunalSelector
              tribunais={tribunais}
              selectedCredentialId={selectedCredentialId}
              selectedTribunalIds={selectedTribunalIds}
              onSelectionChange={setSelectedTribunalIds}
            />
          </div>

          <div>
            <h3 className="text-sm font-medium mb-3">Tipo de Raspagem</h3>
            <ScrapeTypeSelector
              selectedType={selectedType}
              selectedSubTypes={selectedSubTypes}
              onTypeChange={setSelectedType}
              onSubTypesChange={setSelectedSubTypes}
            />
          </div>
        </div>
      </WizardStep>

      {/* Step 4: Frequency */}
      <WizardStep stepNumber={4} currentStep={currentStep} title="Frequência">
        <div className="space-y-6">
          <div>
            <h3 className="text-sm font-medium mb-3">Quando executar</h3>
            <ScheduleFrequencySelector value={frequency} onChange={setFrequency} />
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="active-immediately"
              checked={activeImmediately}
              onCheckedChange={(checked) => setActiveImmediately(checked as boolean)}
            />
            <Label htmlFor="active-immediately" className="text-sm font-normal cursor-pointer">
              Ativar agendamento imediatamente
            </Label>
          </div>
        </div>
      </WizardStep>

      {/* Messages */}
      {message && (
        <Alert variant={message.type === 'error' ? 'destructive' : 'default'} className="mb-4">
          {message.type === 'success' ? (
            <CheckCircle2 className="h-4 w-4" />
          ) : (
            <AlertCircle className="h-4 w-4" />
          )}
          <AlertDescription>{message.text}</AlertDescription>
        </Alert>
      )}

      {/* Navigation */}
      <WizardNavigation
        currentStep={currentStep}
        totalSteps={4}
        onNext={() => setCurrentStep((prev) => Math.min(prev + 1, 4))}
        onPrevious={() => setCurrentStep((prev) => Math.max(prev - 1, 1))}
        onSubmit={handleSubmit}
        onCancel={() => {
          handleReset();
          onCancel?.();
        }}
        isNextDisabled={!stepValidation[currentStep as keyof typeof stepValidation]}
        isSubmitDisabled={!isValid || isSubmitting}
        isSubmitting={isSubmitting}
        submitLabel={isEditMode ? 'Salvar Alterações' : 'Criar Agendamento'}
      />
    </WizardContainer>
  );
}

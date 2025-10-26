/**
 * Wizard Container Component
 * Manages multi-step wizard state and navigation
 */

'use client';

import { createContext, useContext, useState, ReactNode } from 'react';

interface WizardContextValue {
  currentStep: number;
  totalSteps: number;
  isFirstStep: boolean;
  isLastStep: boolean;
  canNavigate: boolean;
  goToStep: (step: number) => void;
  nextStep: () => void;
  previousStep: () => void;
  validateStep: (step: number, isValid: boolean) => void;
}

const WizardContext = createContext<WizardContextValue | null>(null);

export function useWizard() {
  const context = useContext(WizardContext);
  if (!context) {
    throw new Error('useWizard must be used within a WizardContainer');
  }
  return context;
}

interface WizardContainerProps {
  /** Current step (1-indexed) */
  currentStep: number;
  /** Total number of steps */
  totalSteps: number;
  /** Callback when step changes */
  onStepChange: (step: number) => void;
  /** Validation state for each step */
  stepValidation?: Record<number, boolean>;
  /** Children (WizardStep components) */
  children: ReactNode;
  /** Additional CSS classes */
  className?: string;
}

export function WizardContainer({
  currentStep,
  totalSteps,
  onStepChange,
  stepValidation = {},
  children,
  className = '',
}: WizardContainerProps) {
  const isFirstStep = currentStep === 1;
  const isLastStep = currentStep === totalSteps;
  const canNavigate = stepValidation[currentStep] ?? false;

  const goToStep = (step: number) => {
    if (step >= 1 && step <= totalSteps) {
      onStepChange(step);
    }
  };

  const nextStep = () => {
    if (!isLastStep && canNavigate) {
      goToStep(currentStep + 1);
    }
  };

  const previousStep = () => {
    if (!isFirstStep) {
      goToStep(currentStep - 1);
    }
  };

  const validateStep = (step: number, isValid: boolean) => {
    // This is handled via stepValidation prop from parent
    // Kept for API compatibility if needed
  };

  const value: WizardContextValue = {
    currentStep,
    totalSteps,
    isFirstStep,
    isLastStep,
    canNavigate,
    goToStep,
    nextStep,
    previousStep,
    validateStep,
  };

  return (
    <WizardContext.Provider value={value}>
      <div className={className}>
        {/* Step Indicator */}
        <div className="mb-6">
          <p className="text-sm text-muted-foreground text-center">
            Etapa {currentStep} de {totalSteps}
          </p>
          {/* Progress Bar */}
          <div className="mt-2 h-2 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-primary transition-all duration-300"
              style={{ width: `${(currentStep / totalSteps) * 100}%` }}
            />
          </div>
        </div>

        {/* Wizard Content */}
        <div>{children}</div>
      </div>
    </WizardContext.Provider>
  );
}

/**
 * Wizard Navigation Component
 * Navigation controls for wizard steps
 */

'use client';

import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { useWizard } from './wizard-container';

interface WizardNavigationProps {
  /** Callback when "Next" is clicked */
  onNext?: () => void;
  /** Callback when "Previous" is clicked */
  onPrevious?: () => void;
  /** Callback when final submit is clicked */
  onSubmit?: () => void | Promise<void>;
  /** Label for the next button */
  nextLabel?: string;
  /** Label for the previous button */
  previousLabel?: string;
  /** Label for the submit button (on last step) */
  submitLabel?: string;
  /** Whether submission is in progress */
  isSubmitting?: boolean;
  /** Additional CSS classes */
  className?: string;
}

export function WizardNavigation({
  onNext,
  onPrevious,
  onSubmit,
  nextLabel = 'Próximo',
  previousLabel = 'Voltar',
  submitLabel = 'Iniciar',
  isSubmitting = false,
  className = '',
}: WizardNavigationProps) {
  const { currentStep, isFirstStep, isLastStep, canNavigate, nextStep, previousStep } = useWizard();

  const handleNext = () => {
    onNext?.();
    nextStep();
  };

  const handlePrevious = () => {
    onPrevious?.();
    previousStep();
  };

  const handleSubmit = async () => {
    if (onSubmit) {
      await onSubmit();
    }
  };

  return (
    <div className={`flex justify-between gap-2 pt-6 ${className}`}>
      {/* Previous Button */}
      <Button
        type="button"
        variant="outline"
        onClick={handlePrevious}
        disabled={isFirstStep || isSubmitting}
      >
        <ChevronLeft className="mr-2 h-4 w-4" />
        {previousLabel}
      </Button>

      {/* Next/Submit Button */}
      {isLastStep ? (
        <Button
          type="button"
          onClick={handleSubmit}
          disabled={!canNavigate || isSubmitting}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Processando...
            </>
          ) : (
            <>
              {submitLabel}
              <ChevronRight className="ml-2 h-4 w-4" />
            </>
          )}
        </Button>
      ) : (
        <Button
          type="button"
          onClick={handleNext}
          disabled={!canNavigate || isSubmitting}
        >
          {nextLabel}
          <ChevronRight className="ml-2 h-4 w-4" />
        </Button>
      )}
    </div>
  );
}

/**
 * Wizard Step Component
 * Individual step within a wizard flow
 */

'use client';

import { ReactNode } from 'react';
import { useWizard } from './wizard-container';

interface WizardStepProps {
  /** Step number (1-indexed) */
  step: number;
  /** Step title */
  title: string;
  /** Step description (optional) */
  description?: string;
  /** Step content */
  children: ReactNode;
  /** Additional CSS classes */
  className?: string;
}

export function WizardStep({
  step,
  title,
  description,
  children,
  className = '',
}: WizardStepProps) {
  const { currentStep } = useWizard();

  // Only render if this is the current step
  if (currentStep !== step) {
    return null;
  }

  return (
    <div className={className}>
      {/* Step Header */}
      <div className="mb-6">
        <h3 className="text-xl font-semibold">{title}</h3>
        {description && (
          <p className="text-sm text-muted-foreground mt-1">{description}</p>
        )}
      </div>

      {/* Step Content */}
      <div>{children}</div>
    </div>
  );
}

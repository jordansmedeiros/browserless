/**
 * Testes para WizardContainer
 */

import { describe, it, expect } from '@jest/globals';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { WizardContainer } from './wizard-container';
import { WizardStep } from './wizard-step';

describe('WizardContainer', () => {
  describe('Navigation', () => {
    it('deve renderizar o primeiro step por padrão', () => {
      render(
        <WizardContainer totalSteps={2}>
          <WizardStep step={1} title="Step 1">
            <div>Conteúdo Step 1</div>
          </WizardStep>
          <WizardStep step={2} title="Step 2">
            <div>Conteúdo Step 2</div>
          </WizardStep>
        </WizardContainer>
      );

      expect(screen.getByText('Conteúdo Step 1')).toBeInTheDocument();
      expect(screen.queryByText('Conteúdo Step 2')).not.toBeInTheDocument();
    });

    it('deve mostrar indicador de etapa correto', () => {
      render(
        <WizardContainer totalSteps={3}>
          <WizardStep step={1} title="Step 1">
            <div>Step 1</div>
          </WizardStep>
        </WizardContainer>
      );

      expect(screen.getByText(/Etapa 1 de 3/i)).toBeInTheDocument();
    });

    it('deve navegar para próximo step ao clicar em "Próximo"', async () => {
      const user = userEvent.setup();

      render(
        <WizardContainer totalSteps={2}>
          <WizardStep step={1} title="Step 1">
            <div>Conteúdo Step 1</div>
          </WizardStep>
          <WizardStep step={2} title="Step 2">
            <div>Conteúdo Step 2</div>
          </WizardStep>
        </WizardContainer>
      );

      const nextButton = screen.getByRole('button', { name: /próximo/i });
      await user.click(nextButton);

      expect(screen.getByText('Conteúdo Step 2')).toBeInTheDocument();
      expect(screen.queryByText('Conteúdo Step 1')).not.toBeInTheDocument();
    });

    it('deve navegar de volta ao clicar em "Voltar"', async () => {
      const user = userEvent.setup();

      render(
        <WizardContainer totalSteps={2} initialStep={2}>
          <WizardStep step={1} title="Step 1">
            <div>Conteúdo Step 1</div>
          </WizardStep>
          <WizardStep step={2} title="Step 2">
            <div>Conteúdo Step 2</div>
          </WizardStep>
        </WizardContainer>
      );

      const backButton = screen.getByRole('button', { name: /voltar/i });
      await user.click(backButton);

      expect(screen.getByText('Conteúdo Step 1')).toBeInTheDocument();
      expect(screen.queryByText('Conteúdo Step 2')).not.toBeInTheDocument();
    });

    it('não deve mostrar botão "Voltar" no primeiro step', () => {
      render(
        <WizardContainer totalSteps={2}>
          <WizardStep step={1} title="Step 1">
            <div>Step 1</div>
          </WizardStep>
        </WizardContainer>
      );

      expect(screen.queryByRole('button', { name: /voltar/i })).not.toBeInTheDocument();
    });

    it('deve mostrar botão "Iniciar" no último step', () => {
      render(
        <WizardContainer totalSteps={2} initialStep={2}>
          <WizardStep step={2} title="Step 2">
            <div>Step 2</div>
          </WizardStep>
        </WizardContainer>
      );

      expect(screen.getByRole('button', { name: /iniciar/i })).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /próximo/i })).not.toBeInTheDocument();
    });
  });

  describe('Validation', () => {
    it('deve desabilitar "Próximo" quando validação falha', () => {
      const validate = () => false;

      render(
        <WizardContainer totalSteps={2}>
          <WizardStep step={1} title="Step 1" validate={validate}>
            <div>Step 1</div>
          </WizardStep>
        </WizardContainer>
      );

      const nextButton = screen.getByRole('button', { name: /próximo/i });
      expect(nextButton).toBeDisabled();
    });

    it('deve habilitar "Próximo" quando validação passa', () => {
      const validate = () => true;

      render(
        <WizardContainer totalSteps={2}>
          <WizardStep step={1} title="Step 1" validate={validate}>
            <div>Step 1</div>
          </WizardStep>
        </WizardContainer>
      );

      const nextButton = screen.getByRole('button', { name: /próximo/i });
      expect(nextButton).not.toBeDisabled();
    });

    it('deve chamar callback onNext ao clicar em "Próximo"', async () => {
      const user = userEvent.setup();
      const onNext = jest.fn();

      render(
        <WizardContainer totalSteps={2} onNext={onNext}>
          <WizardStep step={1} title="Step 1">
            <div>Step 1</div>
          </WizardStep>
        </WizardContainer>
      );

      const nextButton = screen.getByRole('button', { name: /próximo/i });
      await user.click(nextButton);

      expect(onNext).toHaveBeenCalledWith(1, 2);
    });
  });

  describe('Progress Bar', () => {
    it('deve mostrar progresso de 50% na step 1 de 2', () => {
      render(
        <WizardContainer totalSteps={2}>
          <WizardStep step={1} title="Step 1">
            <div>Step 1</div>
          </WizardStep>
        </WizardContainer>
      );

      const progressBar = screen.getByRole('progressbar');
      expect(progressBar).toHaveAttribute('aria-valuenow', '50');
    });

    it('deve mostrar progresso de 100% na última step', () => {
      render(
        <WizardContainer totalSteps={2} initialStep={2}>
          <WizardStep step={2} title="Step 2">
            <div>Step 2</div>
          </WizardStep>
        </WizardContainer>
      );

      const progressBar = screen.getByRole('progressbar');
      expect(progressBar).toHaveAttribute('aria-valuenow', '100');
    });
  });

  describe('Submit', () => {
    it('deve chamar onSubmit ao clicar em "Iniciar" no último step', async () => {
      const user = userEvent.setup();
      const onSubmit = jest.fn();

      render(
        <WizardContainer totalSteps={2} initialStep={2} onSubmit={onSubmit}>
          <WizardStep step={2} title="Step 2">
            <div>Step 2</div>
          </WizardStep>
        </WizardContainer>
      );

      const submitButton = screen.getByRole('button', { name: /iniciar/i });
      await user.click(submitButton);

      expect(onSubmit).toHaveBeenCalled();
    });

    it('deve desabilitar "Iniciar" quando está submetendo', () => {
      render(
        <WizardContainer totalSteps={1} initialStep={1} isSubmitting={true}>
          <WizardStep step={1} title="Step 1">
            <div>Step 1</div>
          </WizardStep>
        </WizardContainer>
      );

      const submitButton = screen.getByRole('button', { name: /iniciar/i });
      expect(submitButton).toBeDisabled();
    });
  });
});

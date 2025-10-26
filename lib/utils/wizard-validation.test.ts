/**
 * Unit Tests for Wizard Validation Logic
 * Tests for improve-scrape-ux Phase 1 - Modal Wizard UI
 */

import { describe, it } from 'mocha';
import { expect } from 'chai';

/**
 * Wizard validation functions
 * Extracted from wizard logic for testing
 */

export function validateStep1(selectedTribunals: string[]): { valid: boolean; error?: string } {
  if (!selectedTribunals || selectedTribunals.length === 0) {
    return { valid: false, error: 'Selecione pelo menos um tribunal' };
  }
  return { valid: true };
}

export function validateStep2(scrapeType: string, subtypes?: string[]): { valid: boolean; error?: string } {
  if (!scrapeType || scrapeType.trim() === '') {
    return { valid: false, error: 'Selecione o tipo de raspagem' };
  }

  if (scrapeType === 'pendentes') {
    if (!subtypes || subtypes.length === 0) {
      return { valid: false, error: 'Selecione pelo menos um subtipo para raspagem de pendentes' };
    }
  }

  return { valid: true };
}

export function canNavigateToStep2(selectedTribunals: string[]): boolean {
  const validation = validateStep1(selectedTribunals);
  return validation.valid;
}

export function canSubmitForm(selectedTribunals: string[], scrapeType: string, subtypes?: string[]): boolean {
  const step1Valid = validateStep1(selectedTribunals).valid;
  const step2Valid = validateStep2(scrapeType, subtypes).valid;
  return step1Valid && step2Valid;
}

describe('Wizard Validation', () => {
  describe('validateStep1', () => {
    it('should pass validation when tribunals are selected', () => {
      const result = validateStep1(['TRT3-1g', 'TRT15-1g']);
      expect(result.valid).to.be.true;
      expect(result.error).to.be.undefined;
    });

    it('should fail validation when no tribunals are selected', () => {
      const result = validateStep1([]);
      expect(result.valid).to.be.false;
      expect(result.error).to.equal('Selecione pelo menos um tribunal');
    });

    it('should fail validation when tribunals is null/undefined', () => {
      const result = validateStep1(null as any);
      expect(result.valid).to.be.false;
      expect(result.error).to.equal('Selecione pelo menos um tribunal');
    });

    it('should pass validation with single tribunal', () => {
      const result = validateStep1(['TRT3-1g']);
      expect(result.valid).to.be.true;
    });

    it('should pass validation with all 48 tribunals (max)', () => {
      // 24 TRTs x 2 graus = 48 tribunals
      const allTribunals = [];
      for (let i = 1; i <= 24; i++) {
        allTribunals.push(`TRT${i}-1g`, `TRT${i}-2g`);
      }
      const result = validateStep1(allTribunals);
      expect(result.valid).to.be.true;
    });
  });

  describe('validateStep2', () => {
    it('should pass validation for acervo_geral type', () => {
      const result = validateStep2('acervo_geral');
      expect(result.valid).to.be.true;
      expect(result.error).to.be.undefined;
    });

    it('should pass validation for arquivados type', () => {
      const result = validateStep2('arquivados');
      expect(result.valid).to.be.true;
    });

    it('should pass validation for minha_pauta type', () => {
      const result = validateStep2('minha_pauta');
      expect(result.valid).to.be.true;
    });

    it('should fail validation when scrapeType is empty', () => {
      const result = validateStep2('');
      expect(result.valid).to.be.false;
      expect(result.error).to.equal('Selecione o tipo de raspagem');
    });

    it('should fail validation when scrapeType is whitespace', () => {
      const result = validateStep2('   ');
      expect(result.valid).to.be.false;
      expect(result.error).to.equal('Selecione o tipo de raspagem');
    });

    describe('pendentes type validation', () => {
      it('should fail validation when pendentes has no subtypes', () => {
        const result = validateStep2('pendentes', []);
        expect(result.valid).to.be.false;
        expect(result.error).to.equal('Selecione pelo menos um subtipo para raspagem de pendentes');
      });

      it('should fail validation when pendentes has undefined subtypes', () => {
        const result = validateStep2('pendentes');
        expect(result.valid).to.be.false;
        expect(result.error).to.equal('Selecione pelo menos um subtipo para raspagem de pendentes');
      });

      it('should pass validation when pendentes has at least one subtype', () => {
        const result = validateStep2('pendentes', ['analise']);
        expect(result.valid).to.be.true;
      });

      it('should pass validation when pendentes has multiple subtypes', () => {
        const result = validateStep2('pendentes', ['analise', 'conclusao', 'publicacao']);
        expect(result.valid).to.be.true;
      });
    });
  });

  describe('canNavigateToStep2', () => {
    it('should allow navigation when step1 is valid', () => {
      expect(canNavigateToStep2(['TRT3-1g'])).to.be.true;
    });

    it('should block navigation when step1 is invalid', () => {
      expect(canNavigateToStep2([])).to.be.false;
    });
  });

  describe('canSubmitForm', () => {
    it('should allow submission with valid configuration', () => {
      const result = canSubmitForm(['TRT3-1g'], 'acervo_geral');
      expect(result).to.be.true;
    });

    it('should block submission when step1 is invalid', () => {
      const result = canSubmitForm([], 'acervo_geral');
      expect(result).to.be.false;
    });

    it('should block submission when step2 is invalid', () => {
      const result = canSubmitForm(['TRT3-1g'], '');
      expect(result).to.be.false;
    });

    it('should block submission when pendentes has no subtypes', () => {
      const result = canSubmitForm(['TRT3-1g'], 'pendentes', []);
      expect(result).to.be.false;
    });

    it('should allow submission when pendentes has subtypes', () => {
      const result = canSubmitForm(['TRT3-1g'], 'pendentes', ['analise']);
      expect(result).to.be.true;
    });

    it('should allow submission with multiple tribunals and subtypes', () => {
      const result = canSubmitForm(
        ['TRT3-1g', 'TRT15-1g', 'TRT24-2g'],
        'pendentes',
        ['analise', 'conclusao']
      );
      expect(result).to.be.true;
    });
  });
});

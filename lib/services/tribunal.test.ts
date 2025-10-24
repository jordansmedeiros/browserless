/**
 * Testes para o Tribunal Service
 */

import {
  validateTRTCode,
  normalizeTRTCode,
  validateGrau,
  grauToString,
} from './tribunal';
import { ALL_TRT_CODES } from '../types/tribunal';

describe('Tribunal Service', () => {
  describe('validateTRTCode', () => {
    it('deve aceitar códigos TRT válidos', () => {
      expect(() => validateTRTCode('TRT3')).not.toThrow();
      expect(() => validateTRTCode('TRT15')).not.toThrow();
      expect(() => validateTRTCode('TRT24')).not.toThrow();
    });

    it('deve rejeitar códigos TRT inválidos', () => {
      expect(() => validateTRTCode('TRT25')).toThrow();
      expect(() => validateTRTCode('TRT0')).toThrow();
      expect(() => validateTRTCode('INVALID')).toThrow();
    });
  });

  describe('normalizeTRTCode', () => {
    it('deve normalizar lowercase para uppercase', () => {
      expect(normalizeTRTCode('trt3')).toBe('TRT3');
      expect(normalizeTRTCode('trt15')).toBe('TRT15');
    });

    it('deve normalizar números para TRT codes', () => {
      expect(normalizeTRTCode(3)).toBe('TRT3');
      expect(normalizeTRTCode('3')).toBe('TRT3');
      expect(normalizeTRTCode(15)).toBe('TRT15');
      expect(normalizeTRTCode('15')).toBe('TRT15');
    });

    it('deve manter códigos já normalizados', () => {
      expect(normalizeTRTCode('TRT3')).toBe('TRT3');
      expect(normalizeTRTCode('TRT15')).toBe('TRT15');
    });

    it('deve rejeitar números fora do range', () => {
      expect(() => normalizeTRTCode(0)).toThrow();
      expect(() => normalizeTRTCode(25)).toThrow();
      expect(() => normalizeTRTCode('0')).toThrow();
      expect(() => normalizeTRTCode('25')).toThrow();
    });

    it('deve remover espaços', () => {
      expect(normalizeTRTCode(' TRT3 ')).toBe('TRT3');
      expect(normalizeTRTCode(' 3 ')).toBe('TRT3');
    });
  });

  describe('validateGrau', () => {
    it('deve aceitar graus válidos', () => {
      expect(validateGrau('1g')).toBe('1g');
      expect(validateGrau('2g')).toBe('2g');
    });

    it('deve rejeitar graus inválidos', () => {
      expect(() => validateGrau('3g')).toThrow();
      expect(() => validateGrau('primeiro')).toThrow();
      expect(() => validateGrau('1')).toThrow();
    });
  });

  describe('grauToString', () => {
    it('deve converter grau para string legível', () => {
      expect(grauToString('1g')).toBe('Primeiro Grau');
      expect(grauToString('2g')).toBe('Segundo Grau');
    });
  });

  describe('ALL_TRT_CODES', () => {
    it('deve conter exatamente 24 TRTs', () => {
      expect(ALL_TRT_CODES).toHaveLength(24);
    });

    it('deve conter TRT1 a TRT24', () => {
      for (let i = 1; i <= 24; i++) {
        expect(ALL_TRT_CODES).toContain(`TRT${i}`);
      }
    });
  });
});

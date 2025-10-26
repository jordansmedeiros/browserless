/**
 * Testes para o Tribunal Service
 */

import { expect } from 'chai';
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
      expect(() => validateTRTCode('TRT3')).to.not.throw();
      expect(() => validateTRTCode('TRT15')).to.not.throw();
      expect(() => validateTRTCode('TRT24')).to.not.throw();
    });

    it('deve rejeitar códigos TRT inválidos', () => {
      expect(() => validateTRTCode('TRT25')).to.throw();
      expect(() => validateTRTCode('TRT0')).to.throw();
      expect(() => validateTRTCode('INVALID')).to.throw();
    });
  });

  describe('normalizeTRTCode', () => {
    it('deve normalizar lowercase para uppercase', () => {
      expect(normalizeTRTCode('trt3')).to.equal('TRT3');
      expect(normalizeTRTCode('trt15')).to.equal('TRT15');
    });

    it('deve normalizar números para TRT codes', () => {
      expect(normalizeTRTCode(3)).to.equal('TRT3');
      expect(normalizeTRTCode('3')).to.equal('TRT3');
      expect(normalizeTRTCode(15)).to.equal('TRT15');
      expect(normalizeTRTCode('15')).to.equal('TRT15');
    });

    it('deve manter códigos já normalizados', () => {
      expect(normalizeTRTCode('TRT3')).to.equal('TRT3');
      expect(normalizeTRTCode('TRT15')).to.equal('TRT15');
    });

    it('deve rejeitar números fora do range', () => {
      expect(() => normalizeTRTCode(0)).to.throw();
      expect(() => normalizeTRTCode(25)).to.throw();
      expect(() => normalizeTRTCode('0')).to.throw();
      expect(() => normalizeTRTCode('25')).to.throw();
    });

    it('deve remover espaços', () => {
      expect(normalizeTRTCode(' TRT3 ')).to.equal('TRT3');
      expect(normalizeTRTCode(' 3 ')).to.equal('TRT3');
    });
  });

  describe('validateGrau', () => {
    it('deve aceitar graus válidos', () => {
      expect(validateGrau('1g')).to.equal('1g');
      expect(validateGrau('2g')).to.equal('2g');
    });

    it('deve rejeitar graus inválidos', () => {
      expect(() => validateGrau('3g')).to.throw();
      expect(() => validateGrau('primeiro')).to.throw();
      expect(() => validateGrau('1')).to.throw();
    });
  });

  describe('grauToString', () => {
    it('deve converter grau para string legível', () => {
      expect(grauToString('1g')).to.equal('Primeiro Grau');
      expect(grauToString('2g')).to.equal('Segundo Grau');
    });
  });

  describe('ALL_TRT_CODES', () => {
    it('deve conter exatamente 24 TRTs', () => {
      expect(ALL_TRT_CODES).to.have.lengthOf(24);
    });

    it('deve conter TRT1 a TRT24', () => {
      for (let i = 1; i <= 24; i++) {
        expect(ALL_TRT_CODES).to.include(`TRT${i}`);
      }
    });
  });
});

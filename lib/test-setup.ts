/**
 * Test setup for browser-based tests
 * Configura o ambiente de testes com Happy DOM e Testing Library
 */

import '@testing-library/jest-dom';
import { expect } from 'chai';

// Configuração global para testes
globalThis.expect = expect as any;

// Mock de funcionalidades de navegador que podem estar faltando
if (typeof window !== 'undefined') {
  // EventSource mock para testes SSE
  if (!window.EventSource) {
    (window as any).EventSource = class EventSource {
      constructor(public url: string) {}
      addEventListener() {}
      removeEventListener() {}
      close() {}
    };
  }
}

export {};

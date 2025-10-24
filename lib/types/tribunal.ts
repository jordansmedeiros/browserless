/**
 * Tribunal Types
 * Tipos relacionados aos Tribunais Regionais do Trabalho (TRTs)
 */

/**
 * TRTCode - Códigos de todos os 24 TRTs do Brasil
 */
export type TRTCode =
  | 'TRT1'  | 'TRT2'  | 'TRT3'  | 'TRT4'  | 'TRT5'  | 'TRT6'
  | 'TRT7'  | 'TRT8'  | 'TRT9'  | 'TRT10' | 'TRT11' | 'TRT12'
  | 'TRT13' | 'TRT14' | 'TRT15' | 'TRT16' | 'TRT17' | 'TRT18'
  | 'TRT19' | 'TRT20' | 'TRT21' | 'TRT22' | 'TRT23' | 'TRT24';

/**
 * Grau - Instância judicial
 * - 1g: Primeiro grau (instância inicial)
 * - 2g: Segundo grau (instância recursal)
 */
export type Grau = '1g' | '2g';

/**
 * Regiao - Regiões geográficas do Brasil
 */
export type Regiao = 'Norte' | 'Nordeste' | 'Centro-Oeste' | 'Sudeste' | 'Sul';

/**
 * TribunalInfo - Informações básicas de um Tribunal
 */
export interface TribunalInfo {
  id: string;
  codigo: TRTCode;
  nome: string;
  regiao: Regiao;
  uf: string;
  cidadeSede: string;
  ativo: boolean;
}

/**
 * TribunalConfig - Configuração de URLs para um grau específico
 */
export interface TribunalConfig {
  id: string;
  tribunalId: string;
  grau: Grau;
  urlBase: string;
  urlLoginSeam: string;
  urlApi: string;
}

/**
 * TribunalWithConfigs - Tribunal completo com suas configurações
 */
export interface TribunalWithConfigs extends TribunalInfo {
  configs: TribunalConfig[];
}

/**
 * Mapeamento de número para código TRT
 */
export function getTRTCode(num: number): TRTCode | null {
  if (num < 1 || num > 24) return null;
  return `TRT${num}` as TRTCode;
}

/**
 * Extrai número do código TRT
 */
export function getTRTNumber(code: TRTCode): number {
  return parseInt(code.replace('TRT', ''), 10);
}

/**
 * Lista de todos os códigos TRT
 */
export const ALL_TRT_CODES: TRTCode[] = [
  'TRT1',  'TRT2',  'TRT3',  'TRT4',  'TRT5',  'TRT6',
  'TRT7',  'TRT8',  'TRT9',  'TRT10', 'TRT11', 'TRT12',
  'TRT13', 'TRT14', 'TRT15', 'TRT16', 'TRT17', 'TRT18',
  'TRT19', 'TRT20', 'TRT21', 'TRT22', 'TRT23', 'TRT24',
];

/**
 * Verifica se uma string é um código TRT válido
 */
export function isValidTRTCode(code: string): code is TRTCode {
  return ALL_TRT_CODES.includes(code as TRTCode);
}

/**
 * Tribunal Types
 * Tipos relacionados aos Tribunais (TRTs, TJs, TRFs e Superiores)
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
 * TJCode - Códigos dos 27 Tribunais de Justiça Estaduais
 */
export type TJCode =
  | 'TJAC' | 'TJAL' | 'TJAM' | 'TJAP' | 'TJBA' | 'TJCE' | 'TJDFT'
  | 'TJES' | 'TJGO' | 'TJMA' | 'TJMG' | 'TJMS' | 'TJMT' | 'TJPA'
  | 'TJPB' | 'TJPE' | 'TJPI' | 'TJPR' | 'TJRJ' | 'TJRN' | 'TJRO'
  | 'TJRR' | 'TJRS' | 'TJSC' | 'TJSE' | 'TJSP' | 'TJTO';

/**
 * TRFCode - Códigos dos 6 Tribunais Regionais Federais
 */
export type TRFCode = 'TRF1' | 'TRF2' | 'TRF3' | 'TRF4' | 'TRF5' | 'TRF6';

/**
 * TribunalSuperiorCode - Códigos dos Tribunais Superiores
 */
export type TribunalSuperiorCode = 'TST' | 'STJ' | 'STF';

/**
 * TribunalCode - União de todos os códigos de tribunais
 */
export type TribunalCode = TRTCode | TJCode | TRFCode | TribunalSuperiorCode;

/**
 * Sistema - Tipo de sistema judicial eletrônico
 */
export type Sistema = 'PJE' | 'EPROC' | 'ESAJ' | 'PROJUDI' | 'THEMIS';

/**
 * Grau - Instância judicial
 * - 1g: Primeiro grau (instância inicial)
 * - 2g: Segundo grau (instância recursal)
 * - unico: Acesso unificado (sem separação de graus)
 */
export type Grau = '1g' | '2g' | 'unico';

/**
 * Regiao - Regiões geográficas do Brasil
 */
export type Regiao = 'Norte' | 'Nordeste' | 'Centro-Oeste' | 'Sudeste' | 'Sul';

/**
 * TribunalInfo - Informações básicas de um Tribunal
 */
export interface TribunalInfo {
  id: string;
  codigo: TribunalCode;
  nome: string;
  regiao: Regiao;
  uf: string;
  cidadeSede: string;
  ativo: boolean;
}

/**
 * TribunalConfig - Configuração de URLs para um sistema e grau específicos
 */
export interface TribunalConfig {
  id: string;
  tribunalId: string;
  sistema: Sistema;
  grau: Grau;
  urlBase: string;
  urlLoginSeam: string;
  urlApi: string | null;
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
 * Lista de todos os códigos TJ
 */
export const ALL_TJ_CODES: TJCode[] = [
  'TJAC', 'TJAL', 'TJAM', 'TJAP', 'TJBA', 'TJCE', 'TJDFT',
  'TJES', 'TJGO', 'TJMA', 'TJMG', 'TJMS', 'TJMT', 'TJPA',
  'TJPB', 'TJPE', 'TJPI', 'TJPR', 'TJRJ', 'TJRN', 'TJRO',
  'TJRR', 'TJRS', 'TJSC', 'TJSE', 'TJSP', 'TJTO',
];

/**
 * Lista de todos os códigos TRF
 */
export const ALL_TRF_CODES: TRFCode[] = [
  'TRF1', 'TRF2', 'TRF3', 'TRF4', 'TRF5', 'TRF6',
];

/**
 * Lista de todos os códigos de Tribunais Superiores
 */
export const ALL_SUPERIOR_CODES: TribunalSuperiorCode[] = [
  'TST', 'STJ', 'STF',
];

/**
 * Verifica se uma string é um código TRT válido
 */
export function isValidTRTCode(code: string): code is TRTCode {
  return ALL_TRT_CODES.includes(code as TRTCode);
}

/**
 * Verifica se uma string é um código TJ válido
 */
export function isValidTJCode(code: string): code is TJCode {
  return ALL_TJ_CODES.includes(code as TJCode);
}

/**
 * Verifica se uma string é um código TRF válido
 */
export function isValidTRFCode(code: string): code is TRFCode {
  return ALL_TRF_CODES.includes(code as TRFCode);
}

/**
 * Verifica se uma string é um código de Tribunal Superior válido
 */
export function isValidSuperiorCode(code: string): code is TribunalSuperiorCode {
  return ALL_SUPERIOR_CODES.includes(code as TribunalSuperiorCode);
}

/**
 * Verifica se uma string é um código de tribunal válido
 */
export function isValidTribunalCode(code: string): code is TribunalCode {
  return isValidTRTCode(code) || isValidTJCode(code) || isValidTRFCode(code) || isValidSuperiorCode(code);
}

/**
 * Retorna o tipo de tribunal com base no código
 */
export function getTipoTribunal(codigo: string): 'TRT' | 'TJ' | 'TRF' | 'Superior' | null {
  if (isValidTRTCode(codigo)) return 'TRT';
  if (isValidTJCode(codigo)) return 'TJ';
  if (isValidTRFCode(codigo)) return 'TRF';
  if (isValidSuperiorCode(codigo)) return 'Superior';
  return null;
}

/**
 * Environment Configuration
 * Determina comportamento baseado no ambiente (development vs production)
 */

// Declaração global para TypeScript
declare global {
  var __envConfigLogged: boolean | undefined;
}

/**
 * Verifica se está rodando em ambiente de produção
 */
export const IS_PRODUCTION = process.env.NODE_ENV === 'production';

/**
 * Verifica se está rodando em ambiente de desenvolvimento
 */
export const IS_DEVELOPMENT = !IS_PRODUCTION;

/**
 * Permite uso de fallbacks de variáveis de ambiente (.env)
 * Em produção: NÃO permite fallbacks (força configuração no banco)
 * Em desenvolvimento: Permite fallbacks para facilitar testes
 */
export const ALLOW_ENV_FALLBACKS = IS_DEVELOPMENT;

/**
 * Log de configuração (apenas uma vez no início)
 */
if (typeof process !== 'undefined' && !global.__envConfigLogged) {
  console.log(`[Environment] Running in ${IS_PRODUCTION ? 'PRODUCTION' : 'DEVELOPMENT'} mode`);
  console.log(`[Environment] Fallbacks permitidos: ${ALLOW_ENV_FALLBACKS ? 'SIM' : 'NÃO'}`);
  global.__envConfigLogged = true;
}

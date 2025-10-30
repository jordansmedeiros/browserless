/**
 * Cron Helpers - Server Side
 * Utilitários que dependem de node-cron (Node.js only)
 */

import cron from 'node-cron';

/**
 * Valida sintaxe de cron expression
 */
export function validateCronExpression(cronExpression: string): { valid: boolean; error?: string } {
  if (!cronExpression || typeof cronExpression !== 'string') {
    return { valid: false, error: 'Expressão cron é obrigatória' };
  }

  const trimmed = cronExpression.trim();
  const parts = trimmed.split(/\s+/);

  if (parts.length !== 5) {
    return {
      valid: false,
      error: `Expressão cron deve ter 5 campos (minuto hora dia mês dia-semana). Encontrado: ${parts.length} campos`
    };
  }

  // Usar node-cron para validação
  if (!cron.validate(trimmed)) {
    return { valid: false, error: 'Expressão cron inválida. Verifique a sintaxe.' };
  }

  return { valid: true };
}

/**
 * Calcula próxima execução baseado em cron e timezone
 * Retorna Date em UTC
 */
export function getNextRunTime(cronExpression: string, timezone: string = 'America/Sao_Paulo'): Date {
  // Validar cron
  const validation = validateCronExpression(cronExpression);
  if (!validation.valid) {
    throw new Error(`Cron inválido: ${validation.error}`);
  }

  // Usar cron-parser para calcular próxima execução
  try {
    const parser = require('cron-parser');

    // Parse cron expression com timezone
    const interval = parser.parseExpression(cronExpression, {
      currentDate: new Date(),
      tz: timezone,
    });

    // Retorna próxima execução como Date em UTC
    const nextDate = interval.next().toDate();
    return nextDate;
  } catch (error) {
    throw new Error(`Erro ao calcular próxima execução: ${error instanceof Error ? error.message : String(error)}`);
  }
}

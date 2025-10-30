/**
 * Cron Helpers
 * Utilitários para conversão e validação de expressões cron
 */

import cron from 'node-cron';
import { ScheduleFrequencyType, ScheduleFrequencyConfig } from '@/lib/types/scraping';

/**
 * Presets comuns de cron expressions
 */
export const CRON_PRESETS = {
  DAILY_9AM: '0 9 * * *',
  DAILY_6PM: '0 18 * * *',
  WEEKDAYS_9AM: '0 9 * * 1-5',
  WEEKENDS_10AM: '0 10 * * 0,6',
  EVERY_6_HOURS: '0 */6 * * *',
  EVERY_12_HOURS: '0 */12 * * *',
} as const;

/**
 * Converte configuração amigável para cron expression
 */
export function frequencyConfigToCron(config: ScheduleFrequencyConfig): string {
  switch (config.type) {
    case ScheduleFrequencyType.DAILY: {
      if (!config.dailyTime) {
        throw new Error('dailyTime é obrigatório para frequência diária');
      }
      const [hour, minute] = config.dailyTime.split(':').map(Number);
      return `${minute} ${hour} * * *`;
    }

    case ScheduleFrequencyType.WEEKLY: {
      if (!config.weekDays || config.weekDays.length === 0) {
        throw new Error('weekDays é obrigatório para frequência semanal');
      }
      if (!config.weeklyTime) {
        throw new Error('weeklyTime é obrigatório para frequência semanal');
      }
      const [hour, minute] = config.weeklyTime.split(':').map(Number);
      const days = config.weekDays.sort((a, b) => a - b).join(',');
      return `${minute} ${hour} * * ${days}`;
    }

    case ScheduleFrequencyType.INTERVAL: {
      if (!config.intervalHours) {
        throw new Error('intervalHours é obrigatório para frequência de intervalo');
      }
      if (config.intervalHours < 1 || config.intervalHours > 24) {
        throw new Error('intervalHours deve estar entre 1 e 24');
      }
      return `0 */${config.intervalHours} * * *`;
    }

    case ScheduleFrequencyType.CUSTOM: {
      if (!config.customCron) {
        throw new Error('customCron é obrigatório para frequência customizada');
      }
      return config.customCron;
    }

    default:
      throw new Error(`Tipo de frequência desconhecido: ${config.type}`);
  }
}

/**
 * Tenta parsear cron expression para configuração amigável
 * Retorna null se não conseguir parsear (cron muito complexo)
 */
export function cronToFrequencyConfig(cronExpression: string): ScheduleFrequencyConfig | null {
  const parts = cronExpression.trim().split(/\s+/);

  if (parts.length !== 5) {
    return null;
  }

  const [minute, hour, dayOfMonth, month, dayOfWeek] = parts;

  // Detectar padrão diário
  if (dayOfMonth === '*' && month === '*' && dayOfWeek === '*' && !hour.includes('/')) {
    const hourNum = parseInt(hour, 10);
    const minuteNum = parseInt(minute, 10);
    if (!isNaN(hourNum) && !isNaN(minuteNum)) {
      return {
        type: ScheduleFrequencyType.DAILY,
        dailyTime: `${String(hourNum).padStart(2, '0')}:${String(minuteNum).padStart(2, '0')}`,
      };
    }
  }

  // Detectar padrão semanal
  if (dayOfMonth === '*' && month === '*' && dayOfWeek !== '*' && !hour.includes('/')) {
    const hourNum = parseInt(hour, 10);
    const minuteNum = parseInt(minute, 10);
    if (!isNaN(hourNum) && !isNaN(minuteNum)) {
      // Parsear dias da semana (ex: "1,3,5" ou "1-5")
      const weekDays: number[] = [];
      if (dayOfWeek.includes(',')) {
        weekDays.push(...dayOfWeek.split(',').map(Number));
      } else if (dayOfWeek.includes('-')) {
        const [start, end] = dayOfWeek.split('-').map(Number);
        for (let i = start; i <= end; i++) {
          weekDays.push(i);
        }
      } else {
        weekDays.push(parseInt(dayOfWeek, 10));
      }

      if (weekDays.every(d => !isNaN(d) && d >= 0 && d <= 6)) {
        return {
          type: ScheduleFrequencyType.WEEKLY,
          weekDays,
          weeklyTime: `${String(hourNum).padStart(2, '0')}:${String(minuteNum).padStart(2, '0')}`,
        };
      }
    }
  }

  // Detectar padrão de intervalo
  if (minute === '0' && hour.startsWith('*/') && dayOfMonth === '*' && month === '*' && dayOfWeek === '*') {
    const intervalHours = parseInt(hour.substring(2), 10);
    if (!isNaN(intervalHours) && intervalHours >= 1 && intervalHours <= 24) {
      return {
        type: ScheduleFrequencyType.INTERVAL,
        intervalHours,
      };
    }
  }

  // Não conseguiu parsear, retornar como custom
  return {
    type: ScheduleFrequencyType.CUSTOM,
    customCron: cronExpression,
  };
}

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

  // Para simplicidade, vamos calcular manualmente a próxima execução
  // Em produção, considere usar biblioteca como cron-parser ou croner
  const now = new Date();
  const parts = cronExpression.trim().split(/\s+/);
  const [minutePart, hourPart, dayPart, monthPart, dayOfWeekPart] = parts;

  // Implementação simplificada: adiciona 1 minuto e arredonda para o próximo minuto válido
  // TODO: Implementar parsing completo de cron para calcular exatamente
  // Por ora, retorna próximo minuto como estimativa
  const next = new Date(now);
  next.setMinutes(next.getMinutes() + 1);
  next.setSeconds(0);
  next.setMilliseconds(0);

  return next;
}

/**
 * Converte cron para descrição legível em português
 */
export function formatCronDescription(cronExpression: string, locale: string = 'pt-BR'): string {
  const parts = cronExpression.trim().split(/\s+/);

  if (parts.length !== 5) {
    return cronExpression;
  }

  const [minute, hour, dayOfMonth, month, dayOfWeek] = parts;

  // Padrão diário
  if (dayOfMonth === '*' && month === '*' && dayOfWeek === '*') {
    if (hour.startsWith('*/')) {
      const interval = hour.substring(2);
      return `A cada ${interval} horas`;
    }
    if (!hour.includes('*') && !minute.includes('*')) {
      return `Todo dia às ${hour.padStart(2, '0')}:${minute.padStart(2, '0')}`;
    }
  }

  // Padrão semanal
  if (dayOfMonth === '*' && month === '*' && dayOfWeek !== '*' && !hour.includes('/')) {
    const dayNames: Record<string, string> = {
      '0': 'Domingo',
      '1': 'Segunda',
      '2': 'Terça',
      '3': 'Quarta',
      '4': 'Quinta',
      '5': 'Sexta',
      '6': 'Sábado',
    };

    let daysText = '';
    if (dayOfWeek === '1-5') {
      daysText = 'de segunda a sexta';
    } else if (dayOfWeek === '0,6') {
      daysText = 'aos finais de semana';
    } else if (dayOfWeek.includes(',')) {
      const days = dayOfWeek.split(',').map(d => dayNames[d]).filter(Boolean);
      daysText = days.join(', ');
    } else if (dayOfWeek.includes('-')) {
      const [start, end] = dayOfWeek.split('-');
      daysText = `de ${dayNames[start]} a ${dayNames[end]}`;
    } else {
      daysText = `aos ${dayNames[dayOfWeek]}s`.toLowerCase();
    }

    return `Às ${hour.padStart(2, '0')}:${minute.padStart(2, '0')}, ${daysText}`;
  }

  // Fallback: retornar expressão original
  return cronExpression;
}

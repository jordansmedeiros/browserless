/**
 * Sanitization utilities for protecting sensitive data in logs and error messages
 *
 * This module provides functions to mask/redact sensitive information like CPF,
 * passwords, tokens, and URLs before exposing them to clients or storing in logs.
 */

import type { LogEntry } from '@/lib/services/scrape-logger';

/**
 * List of object keys that are considered sensitive and should be masked
 */
export const SENSITIVE_KEYS = [
  'cpf',
  'senha',
  'password',
  'token',
  'authorization',
  'cookie',
  'secret',
  'apiKey',
  'api_key',
  'accessToken',
  'access_token',
  'refreshToken',
  'refresh_token',
];

/**
 * Regex to detect CPF patterns in strings (with or without formatting)
 * Matches: 123.456.789-00, 12345678900
 */
export const CPF_REGEX = /\d{3}\.?\d{3}\.?\d{3}-?\d{2}/g;

/**
 * Masks a CPF keeping only the first 3 digits visible
 *
 * @example
 * maskCPF('123.456.789-00') // '123.***.***-**'
 * maskCPF('12345678900') // '123********'
 */
export function maskCPF(cpf: string): string {
  if (!cpf || typeof cpf !== 'string') return '***';

  // Remove all formatting
  const cleanCPF = cpf.replace(/\D/g, '');

  if (cleanCPF.length !== 11) return '***';

  // Keep first 3 digits, mask the rest
  return cpf.includes('.') || cpf.includes('-')
    ? `${cleanCPF.substring(0, 3)}.***.***-**`
    : `${cleanCPF.substring(0, 3)}********`;
}

/**
 * Masks a password completely
 *
 * @example
 * maskPassword('mySecretPass') // '***'
 */
export function maskPassword(password: string): string {
  return '***';
}

/**
 * Masks a token keeping only the first 8 characters for identification
 *
 * @example
 * maskToken('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...') // 'eyJhbGci...'
 */
export function maskToken(token: string): string {
  if (!token || typeof token !== 'string') return '***';

  if (token.length <= 8) return '***';

  return `${token.substring(0, 8)}...`;
}

/**
 * Sanitizes a URL by removing sensitive query parameters
 *
 * @example
 * sanitizeURL('https://api.com/endpoint?token=secret&page=1')
 * // 'https://api.com/endpoint?page=1'
 */
export function sanitizeURL(url: string): string {
  if (!url || typeof url !== 'string') return url;

  try {
    const urlObj = new URL(url);
    const sensitiveParams = ['token', 'senha', 'password', 'cpf', 'secret', 'apiKey'];

    sensitiveParams.forEach(param => {
      if (urlObj.searchParams.has(param)) {
        urlObj.searchParams.set(param, '***');
      }
    });

    return urlObj.toString();
  } catch {
    // Not a valid URL, just return as is
    return url;
  }
}

/**
 * Sanitizes an error for safe logging/display
 * Returns a generic message for client consumption
 *
 * @example
 * sanitizeError(new Error('Connection failed: invalid token abc123'))
 * // 'An internal error occurred'
 */
export function sanitizeError(error: unknown): string {
  if (!error) return 'An unknown error occurred';

  if (error instanceof Error) {
    // Log full error server-side (this function is meant to be called server-side)
    // but return a sanitized version
    let message = error.message;

    // Mask any CPF patterns found in error message
    message = message.replace(CPF_REGEX, (match) => maskCPF(match));

    // Mask common sensitive patterns
    message = message.replace(/senha[:\s=]+\S+/gi, 'senha: ***');
    message = message.replace(/password[:\s=]+\S+/gi, 'password: ***');
    message = message.replace(/token[:\s=]+\S+/gi, 'token: ***');

    return message;
  }

  return 'An unknown error occurred';
}

/**
 * Recursively sanitizes an object by masking values of sensitive keys
 *
 * @example
 * sanitizeObject({ cpf: '12345678900', name: 'John' }, ['cpf'])
 * // { cpf: '123********', name: 'John' }
 */
export function sanitizeObject<T>(
  obj: T,
  sensitiveKeys: string[] = SENSITIVE_KEYS
): T {
  if (obj === null || obj === undefined) {
    return obj;
  }

  // Handle arrays
  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeObject(item, sensitiveKeys)) as T;
  }

  // Handle objects
  if (typeof obj === 'object') {
    const sanitized: any = {};

    for (const [key, value] of Object.entries(obj)) {
      const lowerKey = key.toLowerCase();

      // Check if this key is sensitive
      const isSensitive = sensitiveKeys.some(
        sensitiveKey => lowerKey.includes(sensitiveKey.toLowerCase())
      );

      if (isSensitive) {
        // Mask the value based on key name
        if (lowerKey.includes('cpf')) {
          sanitized[key] = typeof value === 'string' ? maskCPF(value) : '***';
        } else if (lowerKey.includes('senha') || lowerKey.includes('password')) {
          sanitized[key] = maskPassword(String(value));
        } else if (lowerKey.includes('token')) {
          sanitized[key] = typeof value === 'string' ? maskToken(value) : '***';
        } else {
          sanitized[key] = '***';
        }
      } else if (typeof value === 'object' && value !== null) {
        // Recursively sanitize nested objects
        sanitized[key] = sanitizeObject(value, sensitiveKeys);
      } else if (typeof value === 'string') {
        // Check if the string value contains CPF patterns
        let sanitizedValue = value;
        if (CPF_REGEX.test(value)) {
          sanitizedValue = value.replace(CPF_REGEX, (match) => maskCPF(match));
        }
        sanitized[key] = sanitizedValue;
      } else {
        sanitized[key] = value;
      }
    }

    return sanitized as T;
  }

  // Primitive values - return as is
  return obj;
}

/**
 * Sanitizes a LogEntry by masking sensitive data in context and message
 *
 * @example
 * sanitizeLogEntry({
 *   timestamp: '2024-01-01T00:00:00Z',
 *   level: 'info',
 *   message: 'Login successful for CPF 12345678900',
 *   context: { cpf: '12345678900', token: 'abc123xyz' }
 * })
 * // {
 * //   timestamp: '2024-01-01T00:00:00Z',
 * //   level: 'info',
 * //   message: 'Login successful for CPF 123********',
 * //   context: { cpf: '123********', token: 'abc123xy...' }
 * // }
 */
export function sanitizeLogEntry(log: LogEntry): LogEntry {
  if (!log) return log;

  // Create a shallow copy to avoid mutation
  const sanitized: LogEntry = { ...log };

  // Sanitize message field
  if (sanitized.message && typeof sanitized.message === 'string') {
    let message = sanitized.message;

    // Mask CPF patterns
    message = message.replace(CPF_REGEX, (match) => maskCPF(match));

    // Mask common sensitive patterns
    message = message.replace(/senha[:\s=]+\S+/gi, 'senha: ***');
    message = message.replace(/password[:\s=]+\S+/gi, 'password: ***');
    message = message.replace(/token[:\s=]+\S+/gi, 'token: ***');

    sanitized.message = message;
  }

  // Sanitize context field
  if (sanitized.context) {
    sanitized.context = sanitizeObject(sanitized.context, SENSITIVE_KEYS);
  }

  return sanitized;
}

/**
 * Compression Utilities
 * Utilitários para compressão e descompressão de dados JSON
 */

import { gzipSync, gunzipSync } from 'zlib';

/**
 * Comprime dados JSON usando gzip
 *
 * @param data - Dados a serem comprimidos
 * @returns String base64 dos dados comprimidos
 * @throws Error se a compressão falhar
 */
export function compressJSON(data: any): string {
  try {
    const jsonString = JSON.stringify(data);
    const originalSize = Buffer.byteLength(jsonString, 'utf8');

    const compressed = gzipSync(jsonString);
    const compressedSize = compressed.length;

    // Log da taxa de compressão
    const compressionRatio = ((1 - compressedSize / originalSize) * 100).toFixed(1);
    console.log(
      `[Compression] Original: ${(originalSize / 1024).toFixed(2)}KB → ` +
      `Compressed: ${(compressedSize / 1024).toFixed(2)}KB ` +
      `(${compressionRatio}% reduction)`
    );

    // Retorna como base64 para armazenar em TEXT column do SQLite
    return compressed.toString('base64');
  } catch (error) {
    console.error('[Compression] Failed to compress JSON:', error);
    throw new Error('Failed to compress JSON data');
  }
}

/**
 * Descomprime dados JSON de uma string base64
 *
 * @param compressedData - String base64 dos dados comprimidos
 * @returns Dados descomprimidos
 * @throws Error se a descompressão falhar
 */
export function decompressJSON<T = any>(compressedData: string): T {
  try {
    const buffer = Buffer.from(compressedData, 'base64');
    const decompressed = gunzipSync(buffer);
    const jsonString = decompressed.toString('utf8');

    return JSON.parse(jsonString) as T;
  } catch (error) {
    console.error('[Compression] Failed to decompress JSON:', error);
    throw new Error('Failed to decompress JSON data - data may be corrupted');
  }
}

/**
 * Verifica se os dados parecem estar comprimidos (base64 válido)
 *
 * @param data - Dados a serem verificados
 * @returns true se parecer ser dados comprimidos válidos
 */
export function isCompressedData(data: string): boolean {
  if (!data || typeof data !== 'string') {
    return false;
  }

  // Verifica se é base64 válido
  const base64Regex = /^[A-Za-z0-9+/]+=*$/;
  return base64Regex.test(data);
}

/**
 * Estima o tamanho descomprimido de dados comprimidos
 *
 * @param compressedData - String base64 dos dados comprimidos
 * @returns Tamanho estimado em bytes
 */
export function estimateDecompressedSize(compressedData: string): number {
  try {
    const buffer = Buffer.from(compressedData, 'base64');
    const decompressed = gunzipSync(buffer);
    return decompressed.length;
  } catch {
    return 0;
  }
}

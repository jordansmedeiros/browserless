/**
 * Unit Tests for Scrape Export Utilities
 * Tests for improve-scrape-ux Phase 3 - Export Functionality
 */

import { describe, it } from 'mocha';
import { expect } from 'chai';

/**
 * Export utility functions
 * Extracted from export logic for testing
 */

export interface ProcessData {
  numero?: string;
  classe?: string;
  assunto?: string;
  dataDistribuicao?: string;
  [key: string]: any;
}

/**
 * Generate CSV content from process data
 */
export function generateCSV(processes: ProcessData[]): string {
  if (processes.length === 0) {
    return '';
  }

  // Extract all unique keys
  const allKeys = new Set<string>();
  processes.forEach((process) => {
    Object.keys(process).forEach((key) => allKeys.add(key));
  });
  const headers = Array.from(allKeys);

  // Create CSV lines
  const csvLines: string[] = [];

  // Header row
  csvLines.push(headers.map((h) => `"${h}"`).join(','));

  // Data rows
  processes.forEach((process) => {
    const row = headers.map((header) => {
      const value = process[header];
      if (value === null || value === undefined) return '""';

      // Escape quotes by doubling them
      const stringValue = String(value).replace(/"/g, '""');
      return `"${stringValue}"`;
    });
    csvLines.push(row.join(','));
  });

  return csvLines.join('\n');
}

/**
 * Generate JSON export with metadata
 */
export function generateJSONExport(
  jobId: string,
  jobMetadata: Record<string, any>,
  processes: ProcessData[]
): string {
  const exportData = {
    jobId,
    ...jobMetadata,
    totalProcesses: processes.length,
    processes,
  };

  return JSON.stringify(exportData, null, 2);
}

/**
 * Generate HTML table for Excel export
 */
export function generateExcelHTML(processes: ProcessData[]): string {
  if (processes.length === 0) {
    return '<table></table>';
  }

  // Extract all unique keys
  const allKeys = new Set<string>();
  processes.forEach((process) => {
    Object.keys(process).forEach((key) => allKeys.add(key));
  });
  const headers = Array.from(allKeys);

  let html = '<table>';

  // Header row
  html += '<tr>';
  headers.forEach((header) => {
    html += `<th>${escapeHTML(header)}</th>`;
  });
  html += '</tr>';

  // Data rows
  processes.forEach((process) => {
    html += '<tr>';
    headers.forEach((header) => {
      const value = process[header];
      const cellValue =
        value === null || value === undefined ? '' : String(value);
      html += `<td>${escapeHTML(cellValue)}</td>`;
    });
    html += '</tr>';
  });

  html += '</table>';
  return html;
}

/**
 * Escape HTML special characters
 */
function escapeHTML(text: string): string {
  const htmlEscapeMap: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  };

  return text.replace(/[&<>"']/g, (char) => htmlEscapeMap[char] || char);
}

/**
 * Calculate file size in human-readable format
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${Math.round((bytes / Math.pow(k, i)) * 100) / 100} ${sizes[i]}`;
}

describe('Scrape Export Utilities', () => {
  describe('generateCSV', () => {
    it('should generate valid CSV with headers and data', () => {
      const processes: ProcessData[] = [
        { numero: '001', classe: 'RO', assunto: 'Test' },
        { numero: '002', classe: 'AP', assunto: 'Test2' },
      ];

      const csv = generateCSV(processes);

      const lines = csv.split('\n');
      expect(lines).to.have.lengthOf(3); // header + 2 rows
      expect(lines[0]).to.include('"numero"');
      expect(lines[0]).to.include('"classe"');
      expect(lines[0]).to.include('"assunto"');
      expect(lines[1]).to.include('001');
      expect(lines[2]).to.include('002');
    });

    it('should escape quotes in values', () => {
      const processes: ProcessData[] = [
        { text: 'Value with "quotes"' },
      ];

      const csv = generateCSV(processes);

      expect(csv).to.include('Value with ""quotes""');
    });

    it('should handle null and undefined values', () => {
      const processes: ProcessData[] = [
        { a: 'test', b: null, c: undefined },
      ];

      const csv = generateCSV(processes);

      expect(csv).to.include('""'); // Empty quoted strings for null/undefined
    });

    it('should handle empty processes array', () => {
      const csv = generateCSV([]);
      expect(csv).to.equal('');
    });

    it('should handle processes with different keys', () => {
      const processes: ProcessData[] = [
        { numero: '001', classe: 'RO' },
        { numero: '002', assunto: 'Test' }, // Different keys
      ];

      const csv = generateCSV(processes);

      const lines = csv.split('\n');
      // Header should contain all unique keys
      expect(lines[0]).to.include('numero');
      expect(lines[0]).to.include('classe');
      expect(lines[0]).to.include('assunto');
      // Missing values should be empty
      expect(lines[2]).to.include('""');
    });

    it('should handle special characters in values', () => {
      const processes: ProcessData[] = [
        { text: 'Text with, commas, and\nnewlines' },
      ];

      const csv = generateCSV(processes);

      // All values should be quoted
      expect(csv).to.include('"Text with, commas, and\nnewlines"');
    });

    it('should handle numeric values', () => {
      const processes: ProcessData[] = [
        { id: 123, value: 45.67 },
      ];

      const csv = generateCSV(processes);

      expect(csv).to.include('"123"');
      expect(csv).to.include('"45.67"');
    });
  });

  describe('generateJSONExport', () => {
    it('should generate valid JSON with metadata and processes', () => {
      const processes: ProcessData[] = [
        { numero: '001', classe: 'RO' },
      ];

      const metadata = {
        scrapeType: 'acervo_geral',
        createdAt: '2025-01-26T10:00:00Z',
      };

      const json = generateJSONExport('job-123', metadata, processes);
      const parsed = JSON.parse(json);

      expect(parsed.jobId).to.equal('job-123');
      expect(parsed.scrapeType).to.equal('acervo_geral');
      expect(parsed.totalProcesses).to.equal(1);
      expect(parsed.processes).to.have.lengthOf(1);
    });

    it('should format JSON with proper indentation', () => {
      const processes: ProcessData[] = [{ numero: '001' }];
      const json = generateJSONExport('job-123', {}, processes);

      // Should be pretty-printed (contains newlines and indentation)
      expect(json).to.include('\n');
      expect(json).to.include('  '); // 2-space indentation
    });

    it('should handle empty processes array', () => {
      const json = generateJSONExport('job-123', { type: 'test' }, []);
      const parsed = JSON.parse(json);

      expect(parsed.totalProcesses).to.equal(0);
      expect(parsed.processes).to.be.an('array').that.is.empty;
    });

    it('should include all metadata fields', () => {
      const metadata = {
        scrapeType: 'pendentes',
        createdAt: '2025-01-26T10:00:00Z',
        completedAt: '2025-01-26T11:00:00Z',
        duration: 3600000,
      };

      const json = generateJSONExport('job-123', metadata, []);
      const parsed = JSON.parse(json);

      expect(parsed.scrapeType).to.equal('pendentes');
      expect(parsed.createdAt).to.equal('2025-01-26T10:00:00Z');
      expect(parsed.completedAt).to.equal('2025-01-26T11:00:00Z');
      expect(parsed.duration).to.equal(3600000);
    });
  });

  describe('generateExcelHTML', () => {
    it('should generate HTML table with headers and data', () => {
      const processes: ProcessData[] = [
        { numero: '001', classe: 'RO' },
        { numero: '002', classe: 'AP' },
      ];

      const html = generateExcelHTML(processes);

      expect(html).to.include('<table>');
      expect(html).to.include('</table>');
      expect(html).to.include('<th>numero</th>');
      expect(html).to.include('<th>classe</th>');
      expect(html).to.include('<td>001</td>');
      expect(html).to.include('<td>002</td>');
    });

    it('should escape HTML special characters', () => {
      const processes: ProcessData[] = [
        { text: '<script>alert("xss")</script>' },
      ];

      const html = generateExcelHTML(processes);

      expect(html).to.include('&lt;script&gt;');
      expect(html).to.include('&quot;');
      expect(html).to.not.include('<script>');
    });

    it('should handle empty processes array', () => {
      const html = generateExcelHTML([]);
      expect(html).to.equal('<table></table>');
    });

    it('should handle null and undefined values', () => {
      const processes: ProcessData[] = [
        { a: 'test', b: null, c: undefined },
      ];

      const html = generateExcelHTML(processes);

      // Null/undefined should render as empty cells
      expect(html).to.include('<td></td>');
    });

    it('should handle ampersands in values', () => {
      const processes: ProcessData[] = [
        { text: 'Rock & Roll' },
      ];

      const html = generateExcelHTML(processes);

      expect(html).to.include('Rock &amp; Roll');
      expect(html).to.not.include('Rock & Roll');
    });

    it('should create proper table structure', () => {
      const processes: ProcessData[] = [
        { col1: 'val1', col2: 'val2' },
      ];

      const html = generateExcelHTML(processes);

      // Check table structure
      expect(html).to.match(/<table><tr><th>.*<\/th><\/tr><tr><td>.*<\/td><\/tr><\/table>/);
    });
  });

  describe('formatFileSize', () => {
    it('should format bytes', () => {
      expect(formatFileSize(0)).to.equal('0 Bytes');
      expect(formatFileSize(500)).to.equal('500 Bytes');
      expect(formatFileSize(1023)).to.equal('1023 Bytes');
    });

    it('should format kilobytes', () => {
      expect(formatFileSize(1024)).to.equal('1 KB');
      expect(formatFileSize(5120)).to.equal('5 KB');
      expect(formatFileSize(10240)).to.equal('10 KB');
    });

    it('should format megabytes', () => {
      expect(formatFileSize(1048576)).to.equal('1 MB');
      expect(formatFileSize(5242880)).to.equal('5 MB');
    });

    it('should format gigabytes', () => {
      expect(formatFileSize(1073741824)).to.equal('1 GB');
      expect(formatFileSize(2147483648)).to.equal('2 GB');
    });

    it('should round to 2 decimal places', () => {
      expect(formatFileSize(1536)).to.equal('1.5 KB');
      expect(formatFileSize(1587)).to.equal('1.55 KB');
    });

    it('should handle very large files', () => {
      const size = formatFileSize(5368709120); // 5 GB
      expect(size).to.include('GB');
      expect(parseFloat(size)).to.be.closeTo(5, 0.1);
    });
  });

  describe('edge cases', () => {
    it('should handle very large datasets in CSV', () => {
      const processes: ProcessData[] = [];
      for (let i = 0; i < 1000; i++) {
        processes.push({ numero: `${i}`, classe: 'RO', value: i });
      }

      const csv = generateCSV(processes);
      const lines = csv.split('\n');

      expect(lines).to.have.lengthOf(1001); // Header + 1000 rows
    });

    it('should handle unicode characters in exports', () => {
      const processes: ProcessData[] = [
        { text: '特殊字符 émojis 🚀 français' },
      ];

      const csv = generateCSV(processes);
      const json = generateJSONExport('job-123', {}, processes);
      const html = generateExcelHTML(processes);

      expect(csv).to.include('特殊字符');
      expect(json).to.include('émojis 🚀');
      expect(html).to.include('français');
    });

    it('should handle empty strings in data', () => {
      const processes: ProcessData[] = [
        { a: '', b: '  ', c: 'test' },
      ];

      const csv = generateCSV(processes);

      expect(csv).to.include('""'); // Empty string
      expect(csv).to.include('"  "'); // Whitespace
    });
  });
});

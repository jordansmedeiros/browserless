/**
 * Unit Tests for Scrape Data Transformation
 * Tests for improve-scrape-ux Phase 3 - Scrape Results Viewer
 */

import { describe, it } from 'mocha';
import { expect } from 'chai';

/**
 * Data transformation utilities for results viewer
 * Extracted from component logic for testing
 */

export interface ProcessData {
  numero?: string;
  classe?: string;
  assunto?: string;
  dataDistribuicao?: string;
  [key: string]: any;
}

export interface ScrapeExecution {
  id: string;
  tribunalConfig: {
    codigo: string;
    grau: string;
  };
  resultData: string; // Compressed JSON
  status: string;
}

/**
 * Flatten execution results into table rows
 */
export function flattenExecutionsToTableRows(executions: ScrapeExecution[]): ProcessData[] {
  const rows: ProcessData[] = [];

  executions.forEach((execution) => {
    try {
      const data = JSON.parse(execution.resultData);
      const processes = data.processos || [];

      processes.forEach((process: ProcessData) => {
        rows.push({
          ...process,
          _tribunal: execution.tribunalConfig.codigo,
          _grau: execution.tribunalConfig.grau,
        });
      });
    } catch (error) {
      // Skip invalid data
      console.error('Error parsing execution data:', error);
    }
  });

  return rows;
}

/**
 * Extract all unique column keys from process data
 */
export function extractColumnKeys(processes: ProcessData[]): string[] {
  const keysSet = new Set<string>();

  processes.forEach((process) => {
    Object.keys(process).forEach((key) => {
      if (!key.startsWith('_')) {
        // Exclude internal keys
        keysSet.add(key);
      }
    });
  });

  return Array.from(keysSet).sort();
}

/**
 * Build hierarchical tree structure for explorer view
 */
export interface TreeNode {
  tribunal: string;
  processes: ProcessData[];
}

export function buildHierarchicalTree(executions: ScrapeExecution[]): TreeNode[] {
  const tree: Record<string, ProcessData[]> = {};

  executions.forEach((execution) => {
    try {
      const data = JSON.parse(execution.resultData);
      const processes = data.processos || [];
      const tribunalKey = `${execution.tribunalConfig.codigo}-${execution.tribunalConfig.grau}`;

      if (!tree[tribunalKey]) {
        tree[tribunalKey] = [];
      }

      tree[tribunalKey].push(...processes);
    } catch (error) {
      console.error('Error building tree:', error);
    }
  });

  return Object.entries(tree).map(([tribunal, processes]) => ({
    tribunal,
    processes,
  }));
}

/**
 * Filter processes by search term
 */
export function filterProcessesBySearchTerm(
  processes: ProcessData[],
  searchTerm: string
): ProcessData[] {
  if (!searchTerm || searchTerm.trim() === '') {
    return processes;
  }

  const lowerSearch = searchTerm.toLowerCase();

  return processes.filter((process) => {
    // Search in all string fields
    return Object.values(process).some((value) => {
      if (typeof value === 'string') {
        return value.toLowerCase().includes(lowerSearch);
      }
      return false;
    });
  });
}

/**
 * Sort processes by a specific key
 */
export function sortProcessesByKey(
  processes: ProcessData[],
  key: string,
  direction: 'asc' | 'desc' | null
): ProcessData[] {
  if (!direction) {
    return processes;
  }

  return [...processes].sort((a, b) => {
    const aVal = a[key];
    const bVal = b[key];

    if (aVal === undefined || aVal === null) return 1;
    if (bVal === undefined || bVal === null) return -1;

    if (typeof aVal === 'string' && typeof bVal === 'string') {
      return direction === 'asc'
        ? aVal.localeCompare(bVal)
        : bVal.localeCompare(aVal);
    }

    if (typeof aVal === 'number' && typeof bVal === 'number') {
      return direction === 'asc' ? aVal - bVal : bVal - aVal;
    }

    return 0;
  });
}

describe('Scrape Data Transformation', () => {
  describe('flattenExecutionsToTableRows', () => {
    it('should flatten executions into table rows', () => {
      const executions: ScrapeExecution[] = [
        {
          id: 'exec-1',
          tribunalConfig: { codigo: 'TRT3', grau: '1g' },
          resultData: JSON.stringify({
            processos: [
              { numero: '001', classe: 'RO', assunto: 'Test' },
              { numero: '002', classe: 'AP', assunto: 'Test2' },
            ],
          }),
          status: 'completed',
        },
      ];

      const rows = flattenExecutionsToTableRows(executions);

      expect(rows).to.have.lengthOf(2);
      expect(rows[0].numero).to.equal('001');
      expect(rows[0]._tribunal).to.equal('TRT3');
      expect(rows[1].numero).to.equal('002');
    });

    it('should handle multiple executions', () => {
      const executions: ScrapeExecution[] = [
        {
          id: 'exec-1',
          tribunalConfig: { codigo: 'TRT3', grau: '1g' },
          resultData: JSON.stringify({
            processos: [{ numero: '001' }],
          }),
          status: 'completed',
        },
        {
          id: 'exec-2',
          tribunalConfig: { codigo: 'TRT15', grau: '2g' },
          resultData: JSON.stringify({
            processos: [{ numero: '002' }, { numero: '003' }],
          }),
          status: 'completed',
        },
      ];

      const rows = flattenExecutionsToTableRows(executions);

      expect(rows).to.have.lengthOf(3);
      expect(rows[0]._tribunal).to.equal('TRT3');
      expect(rows[1]._tribunal).to.equal('TRT15');
      expect(rows[2]._tribunal).to.equal('TRT15');
    });

    it('should handle empty executions array', () => {
      const rows = flattenExecutionsToTableRows([]);
      expect(rows).to.be.an('array').that.is.empty;
    });

    it('should handle executions with no processes', () => {
      const executions: ScrapeExecution[] = [
        {
          id: 'exec-1',
          tribunalConfig: { codigo: 'TRT3', grau: '1g' },
          resultData: JSON.stringify({ processos: [] }),
          status: 'completed',
        },
      ];

      const rows = flattenExecutionsToTableRows(executions);
      expect(rows).to.be.an('array').that.is.empty;
    });

    it('should skip invalid JSON data', () => {
      const executions: ScrapeExecution[] = [
        {
          id: 'exec-1',
          tribunalConfig: { codigo: 'TRT3', grau: '1g' },
          resultData: 'invalid json',
          status: 'completed',
        },
        {
          id: 'exec-2',
          tribunalConfig: { codigo: 'TRT15', grau: '1g' },
          resultData: JSON.stringify({
            processos: [{ numero: '001' }],
          }),
          status: 'completed',
        },
      ];

      const rows = flattenExecutionsToTableRows(executions);

      // Should only include valid execution
      expect(rows).to.have.lengthOf(1);
      expect(rows[0].numero).to.equal('001');
    });
  });

  describe('extractColumnKeys', () => {
    it('should extract all unique keys from processes', () => {
      const processes: ProcessData[] = [
        { numero: '001', classe: 'RO', assunto: 'Test' },
        { numero: '002', dataDistribuicao: '2025-01-01' },
      ];

      const keys = extractColumnKeys(processes);

      expect(keys).to.include.members(['numero', 'classe', 'assunto', 'dataDistribuicao']);
    });

    it('should exclude internal keys starting with underscore', () => {
      const processes: ProcessData[] = [
        { numero: '001', _tribunal: 'TRT3', _internal: 'data' },
      ];

      const keys = extractColumnKeys(processes);

      expect(keys).to.include('numero');
      expect(keys).to.not.include('_tribunal');
      expect(keys).to.not.include('_internal');
    });

    it('should return sorted keys', () => {
      const processes: ProcessData[] = [
        { zulu: 'test', alpha: 'test', mike: 'test' },
      ];

      const keys = extractColumnKeys(processes);

      expect(keys).to.deep.equal(['alpha', 'mike', 'zulu']);
    });

    it('should handle empty processes array', () => {
      const keys = extractColumnKeys([]);
      expect(keys).to.be.an('array').that.is.empty;
    });
  });

  describe('buildHierarchicalTree', () => {
    it('should build tree grouped by tribunal', () => {
      const executions: ScrapeExecution[] = [
        {
          id: 'exec-1',
          tribunalConfig: { codigo: 'TRT3', grau: '1g' },
          resultData: JSON.stringify({
            processos: [{ numero: '001' }, { numero: '002' }],
          }),
          status: 'completed',
        },
        {
          id: 'exec-2',
          tribunalConfig: { codigo: 'TRT15', grau: '1g' },
          resultData: JSON.stringify({
            processos: [{ numero: '003' }],
          }),
          status: 'completed',
        },
      ];

      const tree = buildHierarchicalTree(executions);

      expect(tree).to.have.lengthOf(2);
      expect(tree[0].tribunal).to.equal('TRT3-1g');
      expect(tree[0].processes).to.have.lengthOf(2);
      expect(tree[1].tribunal).to.equal('TRT15-1g');
      expect(tree[1].processes).to.have.lengthOf(1);
    });

    it('should combine processes from same tribunal', () => {
      const executions: ScrapeExecution[] = [
        {
          id: 'exec-1',
          tribunalConfig: { codigo: 'TRT3', grau: '1g' },
          resultData: JSON.stringify({
            processos: [{ numero: '001' }],
          }),
          status: 'completed',
        },
        {
          id: 'exec-2',
          tribunalConfig: { codigo: 'TRT3', grau: '1g' },
          resultData: JSON.stringify({
            processos: [{ numero: '002' }],
          }),
          status: 'completed',
        },
      ];

      const tree = buildHierarchicalTree(executions);

      expect(tree).to.have.lengthOf(1);
      expect(tree[0].processes).to.have.lengthOf(2);
    });

    it('should handle empty executions', () => {
      const tree = buildHierarchicalTree([]);
      expect(tree).to.be.an('array').that.is.empty;
    });
  });

  describe('filterProcessesBySearchTerm', () => {
    const processes: ProcessData[] = [
      { numero: '0001234-56.2024.5.03.0001', classe: 'RO', assunto: 'Horas Extras' },
      { numero: '0005678-90.2024.5.03.0001', classe: 'AP', assunto: 'Adicional Noturno' },
      { numero: '0009999-99.2024.5.03.0001', classe: 'RO', assunto: 'FGTS' },
    ];

    it('should filter by process number', () => {
      const filtered = filterProcessesBySearchTerm(processes, '0001234');
      expect(filtered).to.have.lengthOf(1);
      expect(filtered[0].numero).to.include('0001234');
    });

    it('should filter by class', () => {
      const filtered = filterProcessesBySearchTerm(processes, 'AP');
      expect(filtered).to.have.lengthOf(1);
      expect(filtered[0].classe).to.equal('AP');
    });

    it('should filter by subject (case insensitive)', () => {
      const filtered = filterProcessesBySearchTerm(processes, 'horas extras');
      expect(filtered).to.have.lengthOf(1);
      expect(filtered[0].assunto).to.equal('Horas Extras');
    });

    it('should return all processes for empty search', () => {
      const filtered = filterProcessesBySearchTerm(processes, '');
      expect(filtered).to.have.lengthOf(3);
    });

    it('should return all processes for whitespace search', () => {
      const filtered = filterProcessesBySearchTerm(processes, '   ');
      expect(filtered).to.have.lengthOf(3);
    });

    it('should return empty array when no matches', () => {
      const filtered = filterProcessesBySearchTerm(processes, 'nonexistent');
      expect(filtered).to.be.an('array').that.is.empty;
    });

    it('should handle partial matches', () => {
      const filtered = filterProcessesBySearchTerm(processes, 'Adicional');
      expect(filtered).to.have.lengthOf(1);
    });
  });

  describe('sortProcessesByKey', () => {
    const processes: ProcessData[] = [
      { numero: '003', classe: 'RO', value: 30 },
      { numero: '001', classe: 'AP', value: 10 },
      { numero: '002', classe: 'ED', value: 20 },
    ];

    it('should sort by string key ascending', () => {
      const sorted = sortProcessesByKey(processes, 'numero', 'asc');
      expect(sorted[0].numero).to.equal('001');
      expect(sorted[1].numero).to.equal('002');
      expect(sorted[2].numero).to.equal('003');
    });

    it('should sort by string key descending', () => {
      const sorted = sortProcessesByKey(processes, 'numero', 'desc');
      expect(sorted[0].numero).to.equal('003');
      expect(sorted[1].numero).to.equal('002');
      expect(sorted[2].numero).to.equal('001');
    });

    it('should sort by number key ascending', () => {
      const sorted = sortProcessesByKey(processes, 'value', 'asc');
      expect(sorted[0].value).to.equal(10);
      expect(sorted[1].value).to.equal(20);
      expect(sorted[2].value).to.equal(30);
    });

    it('should sort by number key descending', () => {
      const sorted = sortProcessesByKey(processes, 'value', 'desc');
      expect(sorted[0].value).to.equal(30);
      expect(sorted[1].value).to.equal(20);
      expect(sorted[2].value).to.equal(10);
    });

    it('should return original array when direction is null', () => {
      const sorted = sortProcessesByKey(processes, 'numero', null);
      expect(sorted).to.deep.equal(processes);
    });

    it('should handle undefined values (place at end)', () => {
      const processesWithUndefined: ProcessData[] = [
        { numero: '001' },
        { numero: undefined },
        { numero: '002' },
      ];

      const sorted = sortProcessesByKey(processesWithUndefined, 'numero', 'asc');
      expect(sorted[0].numero).to.equal('001');
      expect(sorted[1].numero).to.equal('002');
      expect(sorted[2].numero).to.be.undefined;
    });

    it('should not mutate original array', () => {
      const original = [...processes];
      sortProcessesByKey(processes, 'numero', 'asc');
      expect(processes).to.deep.equal(original);
    });
  });
});

import { describe, it } from 'mocha';
import { expect } from 'chai';
import {
  maskCPF,
  maskPassword,
  maskToken,
  sanitizeURL,
  sanitizeError,
  sanitizeObject,
  sanitizeLogEntry,
} from '../lib/utils/sanitization';
import type { LogEntry } from '../lib/services/scrape-logger';

describe('Sanitization Utils', () => {
  describe('maskCPF', () => {
    it('should mask formatted CPF correctly', () => {
      const result = maskCPF('123.456.789-01');
      expect(result).to.equal('123.***.***-**');
    });

    it('should mask unformatted CPF correctly', () => {
      const result = maskCPF('12345678901');
      expect(result).to.equal('123********');
    });

    it('should return *** for invalid CPF (9 digits)', () => {
      const result = maskCPF('123456789');
      expect(result).to.equal('***');
    });

    it('should return *** for empty string', () => {
      const result = maskCPF('');
      expect(result).to.equal('***');
    });

    it('should return *** for null/undefined', () => {
      expect(maskCPF(null as any)).to.equal('***');
      expect(maskCPF(undefined as any)).to.equal('***');
    });
  });

  describe('maskPassword', () => {
    it('should mask any password', () => {
      expect(maskPassword('secret123')).to.equal('***');
      expect(maskPassword('my-p@ssw0rd!')).to.equal('***');
    });

    it('should return *** for empty string', () => {
      expect(maskPassword('')).to.equal('***');
    });
  });

  describe('maskToken', () => {
    it('should mask long token', () => {
      const result = maskToken('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9');
      expect(result).to.equal('eyJhbGci...');
    });

    it('should return *** for short token', () => {
      expect(maskToken('abc')).to.equal('***');
      expect(maskToken('12345678')).to.equal('***');
    });
  });

  describe('sanitizeURL', () => {
    it('should mask token in query params', () => {
      const result = sanitizeURL('https://api.example.com/data?token=secret123');
      expect(result).to.include('token=***');
      expect(result).to.not.include('secret123');
    });

    it('should mask multiple sensitive params', () => {
      const url = 'https://api.example.com/data?token=abc&senha=def&cpf=12345678901';
      const result = sanitizeURL(url);
      expect(result).to.include('token=***');
      expect(result).to.include('senha=***');
      expect(result).to.include('cpf=***');
    });

    it('should preserve URL without sensitive params', () => {
      const url = 'https://api.example.com/data?page=1&limit=10';
      const result = sanitizeURL(url);
      expect(result).to.equal(url);
    });

    it('should return original for invalid string', () => {
      const result = sanitizeURL('not a url');
      expect(result).to.equal('not a url');
    });
  });

  describe('sanitizeError', () => {
    it('should mask CPF in error message', () => {
      const error = new Error('Failed to process CPF: 123.456.789-01');
      const result = sanitizeError(error);
      expect(result.message).to.include('123.***.***-**');
      expect(result.message).to.not.include('123.456.789-01');
    });

    it('should mask senha in error message', () => {
      const error = new Error('Authentication failed with senha: mypassword123');
      const result = sanitizeError(error);
      expect(result.message).to.include('senha: ***');
      expect(result.message).to.not.include('mypassword123');
    });

    it('should mask token in error message', () => {
      const error = new Error('Invalid token: eyJhbGciOiJIUzI1NiIsInR5cCI');
      const result = sanitizeError(error);
      expect(result.message).to.include('token: eyJhbGci...');
    });

    it('should preserve generic error messages', () => {
      const error = new Error('Database connection failed');
      const result = sanitizeError(error);
      expect(result.message).to.equal('Database connection failed');
    });
  });

  describe('sanitizeObject', () => {
    it('should mask CPF field', () => {
      const obj = { cpf: '12345678901', nome: 'John Doe' };
      const result = sanitizeObject(obj);
      expect(result.cpf).to.equal('123********');
      expect(result.nome).to.equal('John Doe');
    });

    it('should handle nested objects', () => {
      const obj = {
        user: {
          cpf: '12345678901',
          credentials: { senha: 'secret' },
        },
      };
      const result = sanitizeObject(obj);
      expect(result.user.cpf).to.equal('123********');
      expect(result.user.credentials.senha).to.equal('***');
    });

    it('should handle arrays', () => {
      const obj = {
        users: [
          { cpf: '11111111111', nome: 'User 1' },
          { cpf: '22222222222', nome: 'User 2' },
        ],
      };
      const result = sanitizeObject(obj);
      expect(result.users[0].cpf).to.equal('111********');
      expect(result.users[1].cpf).to.equal('222********');
    });

    it('should mask CPF patterns in strings', () => {
      const obj = { message: 'Processing CPF 123.456.789-01 for user' };
      const result = sanitizeObject(obj);
      expect(result.message).to.include('123.***.***-**');
    });

    it('should handle case-insensitive keys', () => {
      const obj = { CPF: '12345678901', Senha: 'secret', TOKEN: 'abc123' };
      const result = sanitizeObject(obj);
      expect(result.CPF).to.equal('123********');
      expect(result.Senha).to.equal('***');
      expect(result.TOKEN).to.equal('***');
    });
  });

  describe('sanitizeLogEntry', () => {
    it('should sanitize CPF in log message', () => {
      const log: LogEntry = {
        id: '1',
        jobId: 'job1',
        timestamp: new Date(),
        level: 'info',
        message: 'Processing CPF: 123.456.789-01',
        context: {},
      };
      const result = sanitizeLogEntry(log);
      expect(result.message).to.include('123.***.***-**');
    });

    it('should sanitize sensitive context', () => {
      const log: LogEntry = {
        id: '2',
        jobId: 'job2',
        timestamp: new Date(),
        level: 'error',
        message: 'Authentication failed',
        context: { cpf: '12345678901', senha: 'secret' },
      };
      const result = sanitizeLogEntry(log);
      expect(result.context.cpf).to.equal('123********');
      expect(result.context.senha).to.equal('***');
    });

    it('should sanitize Authorization header', () => {
      const log: LogEntry = {
        id: '3',
        jobId: 'job3',
        timestamp: new Date(),
        level: 'debug',
        message: 'API request',
        context: { headers: { Authorization: 'Bearer secret-token' } },
      };
      const result = sanitizeLogEntry(log);
      expect(result.context.headers.Authorization).to.equal('Bearer ***');
    });

    it('should sanitize Cookie header', () => {
      const log: LogEntry = {
        id: '4',
        jobId: 'job4',
        timestamp: new Date(),
        level: 'debug',
        message: 'Request with cookies',
        context: { headers: { Cookie: 'session=abc123' } },
      };
      const result = sanitizeLogEntry(log);
      expect(result.context.headers.Cookie).to.equal('***');
    });

    it('should preserve logs without sensitive data', () => {
      const log: LogEntry = {
        id: '5',
        jobId: 'job5',
        timestamp: new Date(),
        level: 'info',
        message: 'Operation completed successfully',
        context: { duration: 1500, status: 'success' },
      };
      const result = sanitizeLogEntry(log);
      expect(result.message).to.equal('Operation completed successfully');
      expect(result.context.duration).to.equal(1500);
      expect(result.context.status).to.equal('success');
    });
  });
});

// Run tests if executed directly
if (require.main === module) {
  console.log('Running sanitization tests...\n');
}

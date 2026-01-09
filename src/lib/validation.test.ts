import { describe, it, expect } from 'vitest';
import { validateLimit, safeJsonParse, validateSymbol, normalizeSymbol } from './validation';

describe('validation', () => {
  describe('validateLimit', () => {
    const options = { defaultValue: 50, min: 1, max: 100 };

    it('should return parsed value when valid', () => {
      expect(validateLimit('25', options)).toBe(25);
    });

    it('should return default value when null', () => {
      expect(validateLimit(null, options)).toBe(50);
    });

    it('should return default value when empty string', () => {
      expect(validateLimit('', options)).toBe(50);
    });

    it('should return default value when not a number', () => {
      expect(validateLimit('abc', options)).toBe(50);
    });

    it('should clamp to min when below range', () => {
      expect(validateLimit('-10', options)).toBe(1);
      expect(validateLimit('0', options)).toBe(1);
    });

    it('should clamp to max when above range', () => {
      expect(validateLimit('200', options)).toBe(100);
      expect(validateLimit('999', options)).toBe(100);
    });

    it('should handle edge cases', () => {
      expect(validateLimit('1', options)).toBe(1);
      expect(validateLimit('100', options)).toBe(100);
    });
  });

  describe('safeJsonParse', () => {
    it('should parse valid JSON', () => {
      expect(safeJsonParse('{"key": "value"}', {})).toEqual({ key: 'value' });
    });

    it('should return default value when null', () => {
      expect(safeJsonParse(null, { default: true })).toEqual({ default: true });
    });

    it('should return default value for invalid JSON', () => {
      expect(safeJsonParse('invalid json', { default: true })).toEqual({ default: true });
    });

    it('should parse arrays', () => {
      expect(safeJsonParse('[1, 2, 3]', [])).toEqual([1, 2, 3]);
    });

    it('should parse nested objects', () => {
      const input = '{"a": {"b": 1}}';
      expect(safeJsonParse(input, {})).toEqual({ a: { b: 1 } });
    });

    it('should return default for malformed JSON', () => {
      expect(safeJsonParse('{key: value}', 'default')).toBe('default');
    });
  });

  describe('validateSymbol', () => {
    it('should return true for 6-digit symbol', () => {
      expect(validateSymbol('005930')).toBe(true);
      expect(validateSymbol('000660')).toBe(true);
    });

    it('should return true for 12-digit KR symbol', () => {
      expect(validateSymbol('KR7005930003')).toBe(true);
    });

    it('should return false for invalid symbols', () => {
      expect(validateSymbol('12345')).toBe(false); // 5자리
      expect(validateSymbol('1234567')).toBe(false); // 7자리
      expect(validateSymbol('ABCDEF')).toBe(false); // 문자
      expect(validateSymbol('')).toBe(false); // 빈 문자열
    });
  });

  describe('normalizeSymbol', () => {
    it('should extract 6-digit from 12-digit KR symbol', () => {
      expect(normalizeSymbol('KR7005930003')).toBe('700593');
    });

    it('should return last 6 digits for other formats', () => {
      expect(normalizeSymbol('005930')).toBe('005930');
      expect(normalizeSymbol('12345678')).toBe('345678');
    });

    it('should handle 6-digit symbols', () => {
      expect(normalizeSymbol('005930')).toBe('005930');
    });
  });
});

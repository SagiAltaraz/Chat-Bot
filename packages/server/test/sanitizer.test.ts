import { describe, it, expect, vi } from 'vitest';
import { sanitizeString, sanitizeDeep } from '../utils/sanitizer.util';
import { validatePrompt } from '../middleware/prompt.middleware';

describe('sanitizeString', () => {
   it('removes script tags completely', () => {
      const input = '<script>alert(1)</script>hello';
      expect(sanitizeString(input)).toBe('hello');
   });

   it('removes all html in strict mode', () => {
      const input = '<b>hello</b>';
      expect(sanitizeString(input, 'strict')).toBe('hello');
   });

   it('keeps safe tags in lenient mode', () => {
      const input = '<b>hello</b>';
      expect(sanitizeString(input, 'lenient')).toBe('<b>hello</b>');
   });

   it('normalizes whitespace', () => {
      const input = '  hello   world \n\n';
      expect(sanitizeString(input)).toBe('hello world');
   });
});

describe('sanitizeDeep', () => {
   it('sanitizes nested objects', () => {
      const input = {
         text: '<script>alert(1)</script>hello',
         nested: { value: '<b>hi</b>' },
      };

      const result = sanitizeDeep(input);

      expect(result).toEqual({
         text: 'hello',
         nested: { value: 'hi' },
      });
   });

   it('sanitizes arrays', () => {
      const input = ['<script>bad</script>', '<b>ok</b>'];
      const result = sanitizeDeep(input);

      expect(result).toEqual(['', 'ok']);
   });
});

describe('validatePrompt middleware', () => {
   it('validates and normalizes prompt', () => {
      const req: any = {
         body: {
            prompt: '   hello   world   ',
            conversationId: 'session-123',
         },
      };

      const next = vi.fn();

      validatePrompt(req, {} as any, next);

      expect(req.body.prompt).toBe('hello world');
      expect(req.body.conversationId).toBe('session-123');
      expect(next).toHaveBeenCalled();
   });

   it('throws on invalid prompt', () => {
      const req: any = { body: { prompt: '' } };

      expect(() => validatePrompt(req, {} as any, () => {})).toThrow();
   });
});

// utils/sanitizer.ts
import xss from 'xss';
import sanitizeHtml, { type IOptions } from 'sanitize-html';

const CONFIG: Record<'strict' | 'lenient', IOptions> = {
   strict: {
      allowedTags: [],
      allowedAttributes: {},
      disallowedTagsMode: 'discard',
      allowedSchemes: [],
   },
   lenient: {
      allowedTags: ['b', 'i', 'em', 'strong', 'p', 'br'],
      allowedAttributes: {},
      disallowedTagsMode: 'discard',
      allowedSchemes: [],
   },
};

export const sanitizeString = (
   input: unknown,
   mode: 'strict' | 'lenient' = 'strict'
): string =>
   typeof input !== 'string'
      ? ''
      : sanitizeHtml(
           xss(input, {
              whiteList:
                 mode === 'lenient'
                    ? { b: [], i: [], em: [], strong: [], p: [], br: [] }
                    : {},
              stripIgnoreTag: true,
              stripIgnoreTagBody: ['script'],
           }),
           CONFIG[mode]
        )
           .trim()
           .replace(/\s+/g, ' ');

export const sanitizeDeep = (
   obj: any,
   mode: 'strict' | 'lenient' = 'strict'
): any =>
   obj == null
      ? obj
      : typeof obj === 'string'
        ? sanitizeString(obj, mode)
        : Array.isArray(obj)
          ? obj.map((v) => sanitizeDeep(v, mode))
          : typeof obj === 'object'
            ? Object.fromEntries(
                 Object.entries(obj).map(([k, v]) => [k, sanitizeDeep(v, mode)])
              )
            : obj;

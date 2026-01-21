// file: packages/server/middlewares/checkPrompt.middleware.ts
import type { Request, Response, NextFunction } from 'express';

export const checkPromptMiddleware = {
   checkPrompt(req: Request, res: Response, next: NextFunction) {
      try {
         if (req.method !== 'POST') return next();

         const prompt: string | undefined =
            (req.body &&
               (req.body.prompt || req.body.message || req.body.text)) ??
            undefined;

         if (!prompt || typeof prompt !== 'string') return next();

         const normalized = prompt.trim().toLowerCase();

         // 1) Weather intent
         if (isWeatherIntent(normalized)) {
            const city = extractCity(normalized);
            if (!city) return next(); // Let chat handle clarifying the city

            req.params = req.params || {};
            req.params.city = city;

            // Lazy import to avoid circular deps
            const {
               weatherController,
            } = require('../controllers/weather.controller.js');
            return weatherController.getWeather(req, res);
         }

         // 2) Currency rate intent -> let the router/LLM handle it
         if (isExchangeIntent(normalized)) {
            return next();
         }

         // 3) Math equation intent (e.g., "2+2", "solve 3*(4+5)")
         if (isMathIntent(normalized)) {
            const equation = extractEquation(prompt); // use original prompt to preserve symbols/spaces
            if (!equation) return next();

            req.params = req.params || {};
            req.params.equation = equation;

            const {
               calculateController,
            } = require('../controllers/calculate.controller.js');
            return calculateController.calculateEquation(req, res);
         }

         // If nothing matched, continue to chat
         return next();
      } catch {
         return next();
      }
   },
};

/* ---------- Weather helpers ---------- */

function isWeatherIntent(normalized: string): boolean {
   return (
      /\b(weather|temperature|forecast)\b/i.test(normalized) ||
      /what(?:'s| is) the weather/i.test(normalized) ||
      /how (hot|cold)/i.test(normalized)
   );
}

// Robust multi-word city extraction
function extractCity(normalized: string): string | undefined {
   // Prefer "in <city>" or "at <city>"
   const inCityMatch = normalized.match(
      /\b(?:in|at)\s+([a-z]+(?:[ '\-][a-z]+){0,2})\b/i
   );
   if (inCityMatch?.[1]) return tidyCity(inCityMatch[1]);

   // Fallback: last 1–3 non-stop words
   const stop = new Set([
      'the',
      'a',
      'is',
      'please',
      'today',
      'now',
      'me',
      'for',
      'what',
      'whats',
      "what's",
      'weather',
      'temperature',
      'forecast',
      'how',
      'hot',
      'cold',
      'in',
      'at',
   ]);
   const tokens = normalized.split(/\s+/).filter((w) => w && !stop.has(w));

   for (let take = Math.min(3, tokens.length); take >= 1; take--) {
      const candidate = tokens.slice(-take).join(' ');
      if (/^[a-z]+(?:[ '\-][a-z]+){0,2}$/i.test(candidate)) {
         return tidyCity(candidate);
      }
   }
   return undefined;
}

function tidyCity(raw: string): string {
   return raw
      .trim()
      .split(/\s+/)
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ');
}

/* ---------- Exchange rate helpers ---------- */

function isExchangeIntent(normalized: string): boolean {
   // Examples it catches:
   // - "exchange rate usd"
   // - "what's the exchange rate to eur"
   // - "convert to gbp"
   // - "usd rate" / "rate for cad"
   return (
      /\b(exchange rate|rate|forex|fx)\b/i.test(normalized) ||
      /\bconvert(?:ing)?\b/i.test(normalized) ||
      /\bto\s+[a-z]{3}\b/i.test(normalized)
   );
}

function extractCurrency(normalized: string): string | undefined {
   // Look for 3-letter currency code, possibly after "to" or generally anywhere
   // Priority: after "to <code>"
   const toCode = normalized.match(/\bto\s+([a-z]{3})\b/i)?.[1];
   if (toCode) return toCode.toUpperCase();

   // Otherwise, look for a standalone 3-letter code that isn't a stop word
   // Common currency list could be added; keep generic for now
   const code = normalized.match(/\b([a-z]{3})\b/i)?.[1];
   if (code) return code.toUpperCase();

   return undefined;
}

/* ---------- Math equation helpers ---------- */

function isMathIntent(normalized: string): boolean {
   // If it contains math operators or starts with "calculate"/"solve"
   return (
      /\b(calculate|calc|solve|evaluate|what(?:'s| is))\b.*[\d\(\)]/i.test(
         normalized
      ) || /[\d\)]\s*[\+\-\*\/\^]\s*[\d\(]/.test(normalized)
   );
}

function extractEquation(original: string): string | undefined {
   // Keep numbers, operators, parentheses, decimal points, spaces
   const equation = original
      .match(/[\d\.\s\+\-\*\/\^\(\)]+/g)
      ?.join('')
      .trim();
   // Basic sanity: must contain at least one operator and a digit
   if (equation && /[\+\-\*\/\^]/.test(equation) && /\d/.test(equation)) {
      return equation;
   }
   return undefined;
}

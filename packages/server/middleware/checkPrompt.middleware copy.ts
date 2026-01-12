// file: packages/server/middlewares/checkPrompt.middleware.ts
import type { Request, Response, NextFunction } from 'express';

/**
 * Middleware: checkPrompt
 * - If the incoming chat prompt asks for weather, extract the city
 *   and reroute to GET /api/weather/:city
 * - Otherwise, continue to the chat controller.
 */
export const checkPromptMiddleware = {
   checkPrompt(req: Request, res: Response, next: NextFunction) {
      try {
         if (req.method !== 'POST') return next();

         const prompt: string | undefined =
            (req.body &&
               (req.body.prompt || req.body.message || req.body.text)) ??
            undefined;

         if (!prompt || typeof prompt !== 'string') {
            return next();
         }

         const normalized = prompt.trim().toLowerCase();

         const isWeatherIntent =
            /\b(weather|temperature|forecast)\b/.test(normalized) ||
            /what(?:'s| is) the weather/.test(normalized) ||
            /how (hot|cold)/.test(normalized);

         if (!isWeatherIntent) {
            return next();
         }

         if (!isWeatherIntent) return next();

         const city = extractCity(normalized);
         if (!city) return next();

         req.params = req.params || {};
         req.params.city = city;

         const {
            weatherController,
         } = require('../controllers/weather.controller.js');
         console.log();
         return weatherController.getWeather(req, res);
      } catch (err) {
         return next();
      }
   },
};

// Robust multi-word city extraction
function extractCity(normalized: string): string | undefined {
   // 1) Prefer explicit "in <city>" or "at <city>"
   //    Captures 1–3 words with letters, hyphens, or apostrophes
   const inCityMatch = normalized.match(
      /\b(?:in|at)\s+([a-z]+(?:[ '\-][a-z]+){0,2})\b/i
   );
   if (inCityMatch?.[1]) {
      return tidyCity(inCityMatch[1]);
   }

   // 2) Fallback: take last 1–3 non-stop words as a guess
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

   // Try last 3, 2, then 1 tokens
   for (let take = Math.min(3, tokens.length); take >= 1; take--) {
      const candidate = tokens.slice(-take).join(' ');
      if (/^[a-z]+(?:[ '\-][a-z]+){0,2}$/i.test(candidate)) {
         return tidyCity(candidate);
      }
   }

   return undefined;
}

function tidyCity(raw: string): string {
   // Title-case each token: "new york" -> "New York"
   return raw
      .trim()
      .split(/\s+/)
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ');
}

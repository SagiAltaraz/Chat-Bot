import { cache } from '../cache';
import type { Request, Response, NextFunction } from 'express';

export const cacheMiddleware =
   (keyBuilder: (req: any) => string, ttl = 60) =>
   (req: Request, res: Response, next: NextFunction) => {
      const key = keyBuilder(req);
      const cached = cache.get(key);

      if (cached) {
         return res.json(cached);
      }

      const originalJson = res.json.bind(res);
      res.json = (body) => {
         cache.set(key, body, ttl);
         return originalJson(body);
      };

      next();
   };

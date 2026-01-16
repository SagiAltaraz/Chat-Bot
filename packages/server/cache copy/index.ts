export interface CacheProvider {
   get<T>(key: string): T | null;
   set<T>(key: string, value: T, ttl?: number): void;
   del(key: string): void;
}

import { memoryCache } from './memory.cache';
export const cache: CacheProvider = memoryCache;

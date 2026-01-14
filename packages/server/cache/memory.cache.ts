type CacheEntry<T> = {
   value: T;
   expiresAt: number;
};

const store = new Map<string, CacheEntry<any>>();

export const memoryCache = {
   get<T>(key: string): T | null {
      const entry = store.get(key);
      if (!entry) return null;

      if (Date.now() > entry.expiresAt) {
         store.delete(key);
         return null;
      }

      return entry.value as T;
   },

   set<T>(key: string, value: T, ttl = 60) {
      store.set(key, {
         value,
         expiresAt: Date.now() + ttl * 100,
      });
   },

   del(key: string) {
      store.delete(key);
   },
};

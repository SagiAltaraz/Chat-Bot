const store = new Map<string, any>();

export const cache = {
   get: (key: string) => store.get(key) ?? null,
   set: (key: string, value: any) => store.set(key, value),
   del: (key: string) => store.delete(key),
};

export const cacheKeys = {
   weather: (city: string) => `weather:${city.toLowerCase()}`,
   openai: (hash: string) => `openai:${hash}`,
};

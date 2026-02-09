import { cache } from '../cache';
import { weatherRepository } from '../repositories/weather.repository';
import type { Weather } from '../repositories/weather.repository';

export const weatherService = {
   recieveWeather(city: string): Promise<Weather> {
      const cachedWeather = cache.get(`Weather:${city}`);
      if (cachedWeather === null) {
         const weather = weatherRepository.getWeather(city);
         cache.set(`Weather:${city}`, weather);
         setTimeout(() => cache.del(`Weather:${city}`), 1000 * 60 * 60);

         return weather;
      } else {
         return cachedWeather;
      }
   },
};

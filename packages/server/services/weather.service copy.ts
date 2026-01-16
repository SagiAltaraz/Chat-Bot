import { cache } from '../cache';
import { cacheKeys } from '../cache/keys.cahce';

type ApiResponce = {
   weather: [
      {
         description: string;
      },
   ];
   main: {
      temp: number;
   };
   name: string;
};

export type Weather = {
   description: string;
   temperature: number;
   city: string;
};

export const weatherService = {
   async recieveWeather(city: string): Promise<Weather> {
      const cachedWeather = await getCachedWeather(city);
      if (cachedWeather === null) {
         const weatherApiUrl = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${process.env.WEATHER_API_KEY}&units=metric`;
         const response = await fetch(weatherApiUrl);
         const data = (await response.json()) as ApiResponce;
         const weather: Weather = {
            description: data.weather[0].description,
            temperature: data.main.temp,
            city: data.name,
         };
         await setCachedWeather(weather);
         return {
            description: data.weather[0].description,
            temperature: data.main.temp,
            city: data.name,
         };
      } else {
         return cachedWeather as Weather;
      }
   },
};

async function getCachedWeather(city: string) {
   const key = cacheKeys.weather(city);
   const cached = cache.get(key);
   if (cached) return cached;
   return null;
}

async function setCachedWeather(weather: Weather) {
   const key = cacheKeys.weather(weather.city);
   cache.set(key, weather);
}

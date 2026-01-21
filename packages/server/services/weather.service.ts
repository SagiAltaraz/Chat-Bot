import { cache } from '../cache';

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
   temperature: number | string;
   city: string;
};

export const weatherService = {
   async recieveWeather(city: string): Promise<Weather> {
      const cachedWeather = cache.get(`Weather:${city}`);
      if (cachedWeather === null) {
         const apiKey = process.env.OPENWEATHER_API_KEY;
         const weatherApiUrl = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}&units=metric`;
         const response = await fetch(weatherApiUrl);
         const data = (await response.json()) as ApiResponce;
         const weather: Weather = {
            description: data.weather[0].description,
            temperature: data.main.temp,
            city: data.name,
         };
         cache.set(`Weather:${city}`, weather);
         setTimeout(() => cache.del(`Weather:${city}`), 1000 * 60 * 60);
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
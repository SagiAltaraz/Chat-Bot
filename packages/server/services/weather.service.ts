import dotenv from 'dotenv';
dotenv.config();

export type Weather = {
   description: string;
   temperature: number | string;
   city: string;
};

export const weatherService = {
   async recieveWeather(city: string) {
      try {
         const apiKey = process.env.OPENWEATHER_API_KEY;
         if (!apiKey) {
            return await fetchFallbackWeather(city);
         }

         const url = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}&units=metric`;
         const response = await fetch(url);
         const data: any = await response.json();

         if (!response.ok || data.cod !== 200) {
            return {
               city: city,
               temperature: 'Unknown',
               description: 'City not found',
            };
         }

         if (
            !data.main?.temp ||
            !Array.isArray(data.weather) ||
            !data.weather[0]
         ) {
            return {
               city: data.name ?? city,
               temperature: 'Unknown',
               description: 'Weather data unavailable',
            };
         }

         return {
            city: data.name,
            temperature: data.main.temp,
            description: data.weather[0].description,
         };
      } catch (error) {
         console.error('Weather Service Error:', error);
         return { city, temperature: '?', description: 'Service Unavailable' };
      }
   },
};

const WEATHER_CODE_MAP: Record<number, string> = {
   0: 'clear sky',
   1: 'mainly clear',
   2: 'partly cloudy',
   3: 'overcast',
   45: 'fog',
   48: 'depositing rime fog',
   51: 'light drizzle',
   53: 'moderate drizzle',
   55: 'dense drizzle',
   61: 'slight rain',
   63: 'moderate rain',
   65: 'heavy rain',
   71: 'slight snow',
   73: 'moderate snow',
   75: 'heavy snow',
   80: 'rain showers',
   81: 'heavy rain showers',
   82: 'violent rain showers',
   95: 'thunderstorm',
   96: 'thunderstorm with hail',
   99: 'thunderstorm with hail',
};

async function fetchFallbackWeather(city: string): Promise<Weather> {
   try {
      const geoResponse = await fetch(
         `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(
            city
         )}&count=1`
      );
      const geoData: any = await geoResponse.json();
      const place = geoData?.results?.[0];
      if (!place) {
         return { city, temperature: 'Unknown', description: 'City not found' };
      }

      const weatherResponse = await fetch(
         `https://api.open-meteo.com/v1/forecast?latitude=${place.latitude}&longitude=${place.longitude}&current=temperature_2m,weather_code`
      );
      const weatherData: any = await weatherResponse.json();
      const temp = weatherData?.current?.temperature_2m;
      const code = weatherData?.current?.weather_code;

      if (temp === undefined || code === undefined) {
         return {
            city: place.name ?? city,
            temperature: 'Unknown',
            description: 'Weather data unavailable',
         };
      }

      return {
         city: place.name ?? city,
         temperature: temp,
         description: WEATHER_CODE_MAP[code] ?? `weather code ${code}`,
      };
   } catch (error) {
      console.error('Fallback Weather Error:', error);
      return { city, temperature: '?', description: 'Service Unavailable' };
   }
}

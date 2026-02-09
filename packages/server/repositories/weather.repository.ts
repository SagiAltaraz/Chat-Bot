export type ApiResponce = {
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

export const weatherRepository = {
   async getWeather(city: string): Promise<Weather> {
      const apiKey = process.env.WEATHER_API_KEY;
      const weatherApiUrl = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}&units=metric`;
      const response = await fetch(weatherApiUrl);
      const data = (await response.json()) as ApiResponce;
      return {
         description: data.weather[0].description,
         temperature: data.main.temp,
         city: data.name,
      };
   },
};

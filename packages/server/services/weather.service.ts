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
      const weatherApiUrl = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${process.env.WEATHER_API_KEY}&units=metric`;
      const response = await fetch(weatherApiUrl);
      const data = (await response.json()) as ApiResponce;
      return {
         description: data.weather[0].description,
         temperature: data.main.temp,
         city: data.name,
      };
   },
};

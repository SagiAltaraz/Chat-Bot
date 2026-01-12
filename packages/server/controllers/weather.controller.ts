import type { Request, Response } from 'express';
import { weatherService } from '../services/weather.service';
import type { Weather } from '../services/weather.service';

export const weatherController = {
   async getWeather(req: Request, res: Response) {
      const city = String(req.params.city).trim();
      if (!city && city.length === 0)
         return res.status(400).json({ error: 'City is required' });
      const weather: Weather = await weatherService.recieveWeather(city);

      res.json({
         message: `in ${city} is ${weather.temperature} degrees and ${weather.description} weather`,
      });
   },
};

import type { Request, Response } from 'express';
import { weatherService } from '../services/weather.service';
import type { Weather } from '../repositories/weather.repository';

export const weatherController = {
   async getWeather(req: Request, res: Response) {
      const city = String(req.params.city).trim();
      if (!city && city.length === 0)
         return res.status(400).json({ error: 'City is required' });

      const weather: Weather = await weatherService.recieveWeather(city);

      const message = ` ב- ${city} ${weather.temperature} מעלות `;

      res.json({ message });
   },
};

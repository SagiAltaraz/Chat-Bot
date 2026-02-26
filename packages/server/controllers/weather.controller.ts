import type { Request, Response } from 'express';
import { weatherService } from '../services/weather.service';
import type { Weather } from '../repositories/weather.repository';
import { conversationRepository } from '../repositories/conversation.repository';

export const weatherController = {
   async getWeather(req: Request, res: Response) {
      const city = String(req.params.city).trim();
      if (!city && city.length === 0)
         return res.status(400).json({ error: 'City is required' });

      const weather: Weather = await weatherService.recieveWeather(city);

      const message = ` ב- ${city} ${weather.temperature} מעלות `;

      conversationRepository.saveSession(
         req.body.conversationId,
         req.body.prompt,
         {
            id: req.body.conversationId,
            text: message,
         }
      );

      res.json({
         message: message,
      });
   },
};

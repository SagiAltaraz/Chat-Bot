import type { Request, Response, NextFunction } from 'express';
import { intentService } from '../services/intent.service.js';
import { weatherController } from '../controllers/weather.controller';
import { exchangeController } from '../controllers/exchange.controller.js';
import { calculateController } from '../controllers/calculate.controller.js';

export const chatMiddleware = {
   async classifyMessage(req: Request, res: Response, next: NextFunction) {
      const { prompt, conversationId } = req.body;
      const classification = await intentService.classify(
         prompt,
         conversationId
      );
      const { intent, parameters } = classification;
      const cookies = req.cookies;

      if (!cookies?.conversationId) {
         res.cookie('conversationId', conversationId);
      }

      switch (intent) {
         case 'weather':
            req.params.city = String(parameters?.city);
            return weatherController.getWeather(req, res);

         case 'exchange':
            req.params = {
               from: parameters?.from,
               to: parameters?.to,
               amount: String(parameters?.amount),
            };
            return exchangeController.getExchangeRate(req, res);

         case 'calculate':
            return calculateController.calculateEquation(req, res);
      }
      next();
   },
};

import type { Request, Response, NextFunction } from 'express';
import { intentService } from '../services/intent.service.js';
import { weatherController } from '../controllers/weather.controller';
import { exchangeController } from '../controllers/exchange.controller.js';
import { calculateController } from '../controllers/calculate.controller.js';

export const chatMiddleware = {
   async classifyMessage(req: Request, res: Response, next: NextFunction) {
      const { prompt, conversationId } = req.body;
      const classification = await intentService.classify(prompt);
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
               from: String(parameters?.from),
               to: String(parameters?.to),
               amount: String(parameters?.amount),
            };
            return exchangeController.getExchangeRate(req, res);

         case 'calculate':
            req.params = {
               equation: String(parameters?.equation),
            };
            return calculateController.calculateEquation(req, res);
      }
      next();
   },
};

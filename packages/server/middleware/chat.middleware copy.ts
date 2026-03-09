import type { Request, Response, NextFunction } from 'express';
import { intentService } from '../services/intent.service.js';
import { weatherController } from '../controllers/weather.controller';
import { exchangeController } from '../controllers/exchange.controller.js';
import { calculateController } from '../controllers/calculate.controller.js';
import { planController } from '../controllers/plan.controller.js';

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
               from: parameters?.from,
               to: parameters?.to,
               amount: String(parameters?.amount),
            };
            return exchangeController.getExchangeRate(req, res);

         case 'calculate':
            return calculateController.calculateEquation(req, res);

         case 'plan':
            req.body.topic = parameters?.topic || prompt;
            return planController.createPlan(req, res);
      }
      next();
   },
};

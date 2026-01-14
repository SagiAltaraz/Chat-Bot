import type { Request, Response } from 'express';
import { exchangeService } from '../services/exchange.service';
import type { ExchangeRate } from '../services/exchange.service';

export const exchangeController = {
   async getExchangeRate(req: Request, res: Response) {
      const target = String(req.params.target).trim();
      if (!target || target.length === 0) {
         return res.status(400).json({ error: 'Target is required' });
      }

      try {
         const rate: ExchangeRate =
            await exchangeService.recieveExchangeRate(target);
         return res.json({ message: `1 ${rate.target} = ${rate.rate} ILS` });
      } catch (error) {
         return res.status(500).json({ error: 'Failed to get exchange rate' });
      }
   },
};

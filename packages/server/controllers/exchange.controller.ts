import type { Request, Response } from 'express';
import { exchangeService } from '../services/exchange.service';

export const exchangeController = {
   async getExchangeRate(req: Request, res: Response) {
      const result = await exchangeService.getExchangeRate({
         from: 'ILS',
         to: req.params.target,
         amount: 1,
      });
      res.json({
         message: `${result.amount} ${result.from} = ${result.result} ${result.to}`,
      });
   },
};

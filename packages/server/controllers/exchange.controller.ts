import type { Request, Response } from 'express';
import { exchangeService } from '../services/exchange.service';
import { conversationRepository } from '../repositories/conversation.repository';

export const exchangeController = {
   async getExchangeRate(req: Request, res: Response) {
      const result = await exchangeService.getExchangeRate(req.params);

      await conversationRepository.saveSession(
         req.body.conversationId,
         req.body.prompt,
         {
            id: req.body.conversationId,
            text: String(result),
         }
      );
      res.json({
         message: `${result.amount} ${result.from} = ${result.result} ${result.to}`,
      });
   },
};

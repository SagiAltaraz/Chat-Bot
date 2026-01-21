import type { Request, Response } from 'express';
import { mathTranslatorService } from '../services/math_translator.service';
import { conversationRepository } from '../repositories/conversation.repository';

export const calculateController = {
   async calculateEquation(req: Request, res: Response) {
      const result = await mathTranslatorService.calculateFromPrompt(
         req.body.prompt
      );

      await conversationRepository.saveSession(
         req.body.conversationId,
         req.body.prompt,
         {
            id: req.body.conversationId,
            text: result,
         }
      );

      res.json({ message: result });
   },
};

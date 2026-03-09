import type { Request, Response } from 'express';
import { planService } from '../services/plan.service.js';
import { conversationRepository } from '../repositories/conversation.repository.js';

export const planController = {
   /**
    * Creates a plan based on the user's prompt
    */
   async createPlan(req: Request, res: Response) {
      const { prompt, conversationId } = req.body;

      if (!prompt || prompt.trim().length === 0) {
         res.status(400).json({ error: 'Prompt is required' });
         return;
      }

      const result = await planService.createPlan({ prompt });
      if (!result.success) {
         res.status(500).json({ error: result.error });
         return;
      }

      // await conversationRepository.saveSession(conversationId, prompt, {
      //    id: conversationId,
      //    text: JSON.stringify(result.plan),
      // });
      res.json({ plan: result.plan });
   },

   /**
    * Retrieves existing plans
    * @deprecated Legacy endpoint
    */
   async getPlans(_req: Request, res: Response) {
      const plans = await planService.getPlans();
      res.json({ plans });
   },
};

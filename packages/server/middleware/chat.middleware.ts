import type { Request, Response, NextFunction } from 'express';
import { planService } from '../services/plan.service.js';
import { orchestratorService } from '../services/orchestrator.service.js';
import { conversationRepository } from '../repositories/conversation.repository.js';

export const chatMiddleware = {
   async classifyMessage(req: Request, res: Response, next: NextFunction) {
      const { prompt, conversationId } = req.body;
      const result = await planService.createPlan({ prompt });

      if (!result.success || !result.plan) return next();

      if (orchestratorService.isAllGeneral(result.plan)) return next();

      const finalAnswer = await orchestratorService.executePlan(
         result.plan,
         conversationId
      );

      if (!req.cookies?.conversationId) {
         res.cookie('conversationId', conversationId);
      }

      await conversationRepository.saveSession(conversationId, prompt, {
         id: conversationId,
         text: finalAnswer,
      });

      return res.json({ message: finalAnswer });
   },
};

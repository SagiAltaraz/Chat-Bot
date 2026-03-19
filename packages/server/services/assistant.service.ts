import { conversationRepository } from '../repositories/conversation.repository.js';
import { orchestratorService } from './orchestrator.service.js';
import { planService } from './plan.service.js';
import { chatService } from './chat.service.js';

export const assistantService = {
   async sendMessage(
      prompt: string,
      conversationId: string
   ): Promise<
      | {
           content: string;
           modelTimings?: { model: string; responseTimeMs: number }[];
        }
      | undefined
   > {
      const planResult = await planService.createPlan({ prompt });

      if (!planResult.success || !planResult.plan) {
         const response = await chatService.sendMessage(prompt, conversationId);
         return response
            ? {
                 content: response.content,
                 modelTimings: response.modelTimings,
              }
            : undefined;
      }

      if (orchestratorService.isAllGeneral(planResult.plan)) {
         const response = await chatService.sendMessage(prompt, conversationId);
         return response
            ? {
                 content: response.content,
                 modelTimings: response.modelTimings,
              }
            : undefined;
      }

      const finalAnswer = await orchestratorService.executePlan(
         planResult.plan,
         conversationId,
         prompt
      );

      await conversationRepository.appendTurn(
         conversationId,
         prompt,
         finalAnswer.content,
         undefined,
         finalAnswer.modelTimings
      );

      return finalAnswer;
   },
};

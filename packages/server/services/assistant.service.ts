import { conversationRepository } from '../repositories/conversation.repository.js';
import { orchestratorService } from './orchestrator.service.js';
import { planService } from './plan.service.js';
import { chatService } from './chat.service.js';

export const assistantService = {
   async sendMessage(
      prompt: string,
      conversationId: string
   ): Promise<string | undefined> {
      const planResult = await planService.createPlan({ prompt });

      if (!planResult.success || !planResult.plan) {
         const response = await chatService.sendMessage(prompt, conversationId);
         return response?.content;
      }

      if (orchestratorService.isAllGeneral(planResult.plan)) {
         const response = await chatService.sendMessage(prompt, conversationId);
         return response?.content;
      }

      const finalAnswer = await orchestratorService.executePlan(
         planResult.plan,
         conversationId
      );

      await conversationRepository.appendTurn(
         conversationId,
         prompt,
         finalAnswer
      );

      return finalAnswer;
   },
};

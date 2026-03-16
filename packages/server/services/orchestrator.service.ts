import { weatherService } from './weather.service.js';
import { exchangeService } from './exchange.service.js';
import { mathTranslatorService } from './math_translator.service.js';
import { productInformationService } from './productInformation.service.js';
import { chatService } from './chat.service.js';
import type {
   PlanResponse,
   PlanStep,
} from '../repositories/plan.repository.js';

async function executeStep(
   step: PlanStep,
   conversationId: string
): Promise<string> {
   switch (step.intent) {
      case 'weather': {
         const weather = await weatherService.recieveWeather(
            String(step.parameters.city)
         );
         return `${weather.temperature} degrees`;
      }
      case 'exchange': {
         const result = await exchangeService.getExchangeRate({
            from: String(step.parameters.from),
            to: String(step.parameters.to),
            amount: Number(step.parameters.amount),
         });
         return `${result.result}`;
      }
      case 'calculate': {
         return await mathTranslatorService.calculateFromPrompt(
            step.parameters.equation ?? ''
         );
      }
      case 'products': {
         return await productInformationService.getProductInformation(
            String(step.parameters.product_name ?? ''),
            String(step.parameters.query ?? '')
         );
      }
      case 'general': {
         const query = String(step.parameters.query ?? '');
         if (!query) return '';
         const response = await chatService.sendMessage(query, conversationId);
         return response?.content ?? '';
      }
      default:
         return '';
   }
}

export const orchestratorService = {
   isAllGeneral(plan: PlanResponse): boolean {
      return plan.plan.every((step) => step.intent === 'general');
   },

   async executePlan(
      plan: PlanResponse,
      conversationId: string
   ): Promise<string> {
      const stepResults: string[] = [];
      for (const step of plan.plan) {
         stepResults.push(await executeStep(step, conversationId));
      }

      let finalAnswer = plan.final_answer_synthesis;
      for (let i = 0; i < stepResults.length; i++) {
         if (stepResults[i]) {
            finalAnswer = finalAnswer.replaceAll(
               `<result_from_tool_${i + 1}>`,
               stepResults[i]!
            );
         }
      }

      // Remove any unreplaced placeholders (e.g. from empty general steps)
      return finalAnswer
         .replace(/<result_from_tool_\d+>\./g, '')
         .replace(/<result_from_tool_\d+>/g, '')
         .trim();
   },
};

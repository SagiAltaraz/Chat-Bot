import { weatherService } from './weather.service.js';
import { exchangeService } from './exchange.service.js';
import { mathTranslatorService } from './math_translator.service.js';
import { productInformationService } from './productInformation.service.js';
import { chatService } from './chat.service.js';
import type {
   PlanResponse,
   PlanStep,
} from '../repositories/plan.repository.js';
import type { ModelTiming } from '../llm/openAi/client.js';

type StepExecutionResult = {
   content: string;
   modelTimings?: ModelTiming[];
};

async function executeStep(
   step: PlanStep,
   conversationId: string
): Promise<StepExecutionResult> {
   switch (step.intent) {
      case 'weather': {
         const weather = await weatherService.recieveWeather(
            String(step.parameters.city)
         );
         return { content: `${weather.temperature} degrees` };
      }
      case 'exchange': {
         const result = await exchangeService.getExchangeRate({
            from: String(step.parameters.from),
            to: String(step.parameters.to),
            amount: Number(step.parameters.amount),
         });
         return { content: `${result.result}` };
      }
      case 'calculate': {
         return {
            content: await mathTranslatorService.calculateFromPrompt(
               step.parameters.equation ?? ''
            ),
         };
      }
      case 'products': {
         return await productInformationService.getProductInformation(
            String(step.parameters.product_name ?? ''),
            String(step.parameters.query ?? '')
         );
      }
      case 'general': {
         const query = String(step.parameters.query ?? '');
         if (!query) return { content: '' };
         const response = await chatService.generateReply(
            query,
            conversationId
         );
         return { content: response.content };
      }
      default:
         return { content: '' };
   }
}

export const orchestratorService = {
   isAllGeneral(plan: PlanResponse): boolean {
      return plan.plan.every((step) => step.intent === 'general');
   },

   async executePlan(
      plan: PlanResponse,
      conversationId: string
   ): Promise<{ content: string; modelTimings?: ModelTiming[] }> {
      const stepResults: StepExecutionResult[] = [];
      for (const step of plan.plan) {
         stepResults.push(await executeStep(step, conversationId));
      }

      let finalAnswer = plan.final_answer_synthesis;
      for (let i = 0; i < stepResults.length; i++) {
         if (stepResults[i]?.content) {
            finalAnswer = finalAnswer.replaceAll(
               `<result_from_tool_${i + 1}>`,
               stepResults[i]!.content
            );
         }
      }

      // Remove any unreplaced placeholders (e.g. from empty general steps)
      const content = finalAnswer
         .replace(/<result_from_tool_\d+>\./g, '')
         .replace(/<result_from_tool_\d+>/g, '')
         .trim();

      const modelTimings = [
         ...(typeof plan.response_time_ms === 'number'
            ? [
                 {
                    model: 'Planner Model',
                    responseTimeMs: plan.response_time_ms,
                 },
              ]
            : []),
         ...stepResults.flatMap((result) => result.modelTimings ?? []),
      ];

      return {
         content,
         modelTimings: modelTimings.length ? modelTimings : undefined,
      };
   },
};

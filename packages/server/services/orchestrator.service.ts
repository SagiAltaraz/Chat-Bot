import { weatherService } from './weather.service.js';
import { exchangeService } from './exchange.service.js';
import { mathTranslatorService } from './math_translator.service.js';
import { productInformationService } from './productInformation.service.js';
import { chatService } from './chat.service.js';
import { llmClient } from '../llm/openAi/client.js';
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
      conversationId: string,
      originalPrompt?: string
   ): Promise<{ content: string; modelTimings?: ModelTiming[] }> {
      const stepResults: StepExecutionResult[] = [];
      for (const step of plan.plan) {
         stepResults.push(await executeStep(step, conversationId));
      }

      let enrichedSynthesis = plan.final_answer_synthesis;
      for (let i = 0; i < stepResults.length; i++) {
         if (stepResults[i]?.content) {
            enrichedSynthesis = enrichedSynthesis.replaceAll(
               `<result_from_tool_${i + 1}>`,
               stepResults[i]!.content
            );
         }
      }

      enrichedSynthesis = enrichedSynthesis
         .replace(/<result_from_tool_\d+>\./g, '')
         .replace(/<result_from_tool_\d+>/g, '')
         .trim();

      const synthesis = await llmClient.generateText({
         model: 'gpt-4.1-mini',
         instructions:
            'You are a helpful assistant. You receive collected data from various tools. Use it to answer the user question clearly and concisely. Perform any arithmetic needed.',
         prompt: `User question: ${originalPrompt ?? enrichedSynthesis}\n\nCollected data: ${enrichedSynthesis}`,
         temperature: 0.1,
         maxTokens: 200,
      });

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
         ...(synthesis.modelTimings ?? []),
      ];

      return {
         content: synthesis.text.trim(),
         modelTimings: modelTimings.length ? modelTimings : undefined,
      };
   },
};

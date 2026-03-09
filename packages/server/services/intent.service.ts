import { llmClient } from '../llm/openAi/client';
import routerPrompt from '../prompts/router.txt';
import { intentRepository } from '../repositories/intent.repository';
import { planService } from './plan.service.js';
import type { PlanCreationResult } from '../repositories/plan.repository.js';

interface RouterResponse {
   intent: string;
   parameters: any;
   confidence: number;
}

interface PlanReceiveResult {
   success: boolean;
   plan?: any;
   error?: string;
}

export const intentService = {
   async classify(userPrompt: string): Promise<RouterResponse> {
      const response = await callLLM(userPrompt);

      try {
         const cleanText = response.text
            .replace(/```json/g, '')
            .replace(/```/g, '')
            .trim();

         const parsedResponse = JSON.parse(cleanText);
         await logClassification(userPrompt, response.id, parsedResponse);
         return parsedResponse;
      } catch (error) {
         console.error('Router Parsing Failed. Raw text:', response.text);
         return { intent: 'chat', parameters: null, confidence: 0 };
      }
   },

   /**
    * Receives a plan request and generates a plan using the plan service
    * @param userPrompt - The user's request for a plan
    * @returns Promise<PlanReceiveResult> - The result of plan generation
    */
   async receivePlan(userPrompt: string): Promise<PlanReceiveResult> {
      try {
         // Create the plan using the plan service
         const planResult: PlanCreationResult = await planService.createPlan({
            prompt: userPrompt,
         });

         if (planResult.success) {
            return {
               success: true,
               plan: planResult.plan,
            };
         } else {
            return {
               success: false,
               error: planResult.error || 'Failed to create plan',
            };
         }
      } catch (error) {
         const errorMessage =
            error instanceof Error ? error.message : 'Unknown error occurred';
         return {
            success: false,
            error: `Failed to receive plan: ${errorMessage}`,
         };
      }
   },
};

/* 
TODO:
Change the model to a classification model
*/
function callLLM(userPrompt: string) {
   return llmClient.generateText({
      model: 'gpt-4o-mini',
      instructions: routerPrompt,
      prompt: `Return json. User Input: "${userPrompt}"`,
      temperature: 0,
      maxTokens: 300,
      textFormat: { type: 'json_object' },
   });
}

async function logClassification(
   userInput: string,
   conversationId: string,
   result: RouterResponse
) {
   const intentRecord = await intentRepository.getIntentByName(result.intent);
   if (!intentRecord) {
      console.warn(`Detected unknown intent: ${result.intent}`);
      return;
   }
   await intentRepository.createIntentClassification({
      conversationId: conversationId,
      userInput: userInput,
      intent: { connect: { id: intentRecord.id } },
      confidence: result.confidence,
      parameters: result.parameters || {}, // Store JSON
      modelUsed: 'gpt-4o-mini', // Hardcoded for now, or dynamic if you change models
      promptVersion: 'v1',
   });
}

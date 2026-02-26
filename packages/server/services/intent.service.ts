import { intentRepository } from '../repositories/intent.repository';
import { llmClient } from '../llm/openAi/client';

const CLASSIFIER_URL = process.env.CLASSIFIER_URL || 'http://localhost:5001';

interface RouterResponse {
   intent: string;
   parameters: any;
   confidence: number;
}

const PARAM_PROMPTS: Record<string, string> = {
   getWeather:
      'Extract the city name from this message. Return JSON: {"city": "..."}',
   getExchangeRate:
      'Extract currency conversion details. Return JSON: {"from": "USD", "to": "ILS", "amount": 1}. Use 3-letter currency codes. Default from=USD, to=ILS, amount=1.',
};

async function extractParameters(
   intent: string,
   userPrompt: string
): Promise<any> {
   const instructions = PARAM_PROMPTS[intent];
   if (!instructions) return null;

   const response = await llmClient.generateText({
      model: 'gpt-4o-mini',
      prompt: `Extract parameters as json from: ${userPrompt}`,
      instructions,
      maxTokens: 100,
      textFormat: { type: 'json_object' },
   });

   return JSON.parse(response.text);
}

export const intentService = {
   async classify(
      userPrompt: string,
      conversationId: string
   ): Promise<RouterResponse> {
      try {
         const response = await fetch(`${CLASSIFIER_URL}/classify`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt: userPrompt }),
         });

         if (!response.ok)
            throw new Error(`Python server returned ${response.status}`);

         const result = (await response.json()) as RouterResponse;
         if (!result?.intent)
            throw new Error('Invalid response from classifier');

         const parsedResponse = JSON.parse(cleanText);
         await logClassification(userPrompt, response.id, parsedResponse);
         return parsedResponse;
      } catch (error) {
         console.error('Classification failed:', error);
         return { intent: 'chat', parameters: null, confidence: 0 };
      }
   },
};

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
      parameters: result.parameters || {},
      modelUsed: 'all-MiniLM-L6-v2',
      promptVersion: 'v1',
   });
}

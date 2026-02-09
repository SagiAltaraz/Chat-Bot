import { llmClient } from '../llm/openAi/client';
import routerPrompt from '../prompts/router.txt';
import { intentRepository } from '../repositories/intent.repository';

interface RouterResponse {
   intent: string;
   parameters: any;
   confidence: number;
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

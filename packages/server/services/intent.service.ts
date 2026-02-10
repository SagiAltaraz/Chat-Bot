import { intentRepository } from '../repositories/intent.repository';

const CLASSIFIER_URL = process.env.CLASSIFIER_URL || 'http://localhost:8000';

interface RouterResponse {
   intent: string;
   parameters: any;
   confidence: number;
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

         const result = (await response.json()) as RouterResponse;
         await logClassification(userPrompt, conversationId, result);

         return result;
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
      parameters: result.parameters || {}, // Store JSON
      modelUsed: 'all-MiniLM-L6-v2',
      promptVersion: 'v1',
   });
}

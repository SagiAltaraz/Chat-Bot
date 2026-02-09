import { llmClient } from '../llm/openAi/client';
import routerPrompt from '../prompts/router.txt';

interface RouterResponse {
   intent: string;
   parameters: {
      city?: string;
      target?: string;
      from?: string;
      to?: string;
      amount?: number | null;
      equation?: string;
   } | null;
   confidence: number;
}

export const intentService = {
   async classify(userPrompt: string): Promise<RouterResponse> {
      const response = await llmClient.generateText({
         model: 'gpt-4o-mini',
         instructions: routerPrompt,
         prompt: `Return json. User Input: "${userPrompt}"`,
         temperature: 0,
         maxTokens: 300,
         textFormat: { type: 'json_object' },
      });

      console.log(response);

      try {
         const cleanText = response.text
            .replace(/```json/g, '')
            .replace(/```/g, '')
            .trim();

         const parsedResponse = JSON.parse(cleanText);
         return parsedResponse;
      } catch (error) {
         console.error('Router Parsing Failed. Raw text:', response.text);
         return { intent: 'chat', parameters: null, confidence: 0 };
      }
   },
};

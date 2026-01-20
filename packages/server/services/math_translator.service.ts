import { llmClient } from '../llm/client';
import mathTranslatorPrompt from '../prompts/math_translator.txt';

type MathTranslation = {
   equation: string | null;
};

export const mathTranslatorService = {
   async translateToEquation(prompt: string): Promise<string | null> {
      const response = await llmClient.generateText({
         model: 'gpt-4o-mini',
         instructions: mathTranslatorPrompt,
         prompt: `Input: "${prompt}"`,
         temperature: 0,
         maxTokens: 200,
      });

      try {
         const cleanText = response.text
            .replace(/```json/g, '')
            .replace(/```/g, '')
            .trim();

         const parsed = JSON.parse(cleanText) as MathTranslation;
         if (!parsed.equation || typeof parsed.equation !== 'string') {
            return null;
         }
         return parsed.equation.trim();
      } catch (error) {
         console.error('Math Translation Failed. Raw text:', response.text);
         return null;
      }
   },

   async calculateFromPrompt(prompt: string, equation?: string | null) {
      const resolvedEquation =
         equation ?? (await mathTranslatorService.translateToEquation(prompt));

      if (!resolvedEquation) {
         return 'I could not translate the problem to math.';
      }

      try {
         const { evaluate } = await import('mathjs');
         const result = evaluate(resolvedEquation);
         return `${resolvedEquation} = ${result}`;
      } catch {
         return 'Error calculating.';
      }
   },
};

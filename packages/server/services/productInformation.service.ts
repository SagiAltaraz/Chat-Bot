import { llmClient } from '../llm/openAi/client.js';
import type { ModelTiming } from '../llm/openAi/client.js';
import ragGenerationPrompt from '../prompts/rag_generation.txt';

const PYTHON_URL = process.env.PYTHON_SERVER_URL || 'http://localhost:5001';

type SearchKbMatch = {
   text: string;
   distance: number;
   source: string | null;
};

export type ProductInformationResult = {
   content: string;
   modelTimings?: ModelTiming[];
};

export const productInformationService = {
   async getProductInformation(
      productName: string,
      query: string
   ): Promise<ProductInformationResult> {
      const searchQuery = [productName, query].filter(Boolean).join(' ');

      const response = await fetch(`${PYTHON_URL}/search_kb`, {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify({ query: searchQuery, n_results: 3 }),
      });

      if (!response.ok) {
         throw new Error(`Search KB failed: ${response.status}`);
      }

      const data = (await response.json()) as {
         results?: SearchKbMatch[];
         response_time_ms?: number;
      };

      const matches = data.results ?? [];
      if (!matches.length) {
         return {
            content: 'We do not have a matching product in the knowledge base.',
            modelTimings: toModelTimings(data.response_time_ms),
         };
      }

      const context = buildContext(matches);
      const prompt = [
         `User question: ${query || productName}`,
         `Product name: ${productName || 'Unknown'}`,
         '',
         'Retrieved product context:',
         context,
      ].join('\n');

      const generation = await llmClient.generateText({
         model: 'gpt-4.1',
         instructions: ragGenerationPrompt,
         prompt,
         temperature: 0.2,
         maxTokens: 200,
      });

      return {
         content: generation.text.trim(),
         modelTimings: [
            ...(toModelTimings(data.response_time_ms) ?? []),
            ...(generation.modelTimings ?? []),
         ],
      };
   },
};

function buildContext(matches: SearchKbMatch[]): string {
   return matches
      .map(
         (match, index) =>
            `Match ${index + 1}:\nSource: ${match.source ?? 'unknown'}\nContent: ${match.text}`
      )
      .join('\n\n');
}

function toModelTimings(responseTimeMs?: number): ModelTiming[] | undefined {
   if (typeof responseTimeMs !== 'number') {
      return undefined;
   }

   return [
      {
         model: 'Product Search KB',
         responseTimeMs,
      },
   ];
}

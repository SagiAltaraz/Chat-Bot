import { llmClient } from '../llm/openAi/client.js';
import ragPrompt from '../prompts/rag_generation.txt';

const PYTHON_URL = process.env.PYTHON_SERVER_URL || 'http://localhost:5001';

export const productInformationService = {
   async getProductInformation(
      productName: string,
      query: string
   ): Promise<string> {
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
         results: Array<{ text: string; distance: number }>;
      };

      // Filter out chunks that are too far from the query (distance > 1.0)
      const relevant = data.results.filter((r) => r.distance < 1.0);
      const context = (
         relevant.length > 0 ? relevant : data.results.slice(0, 1)
      )
         .map((r) => r.text)
         .join('\n\n');

      const result = await llmClient.generateText({
         model: 'gpt-4o-mini',
         instructions: `${ragPrompt}\n\nContext:\n${context}`,
         prompt: query || `Tell me about ${productName}`,
         temperature: 0.2,
         maxTokens: 300,
      });

      return result.text;
   },
};

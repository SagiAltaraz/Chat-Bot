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
         results: Array<{ text: string }>;
      };
      const context = data.results.map((r) => r.text).join('\n\n');

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

const PYTHON_URL = process.env.PYTHON_SERVER_URL || 'http://localhost:5001';

export const productInformationService = {
   async getProductInformation(
      productName: string,
      query: string
   ): Promise<string> {
      const searchQuery = [productName, query].filter(Boolean).join(' ');

      const response = await fetch(`${PYTHON_URL}/answer_kb`, {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify({ query: searchQuery, n_results: 3 }),
      });

      if (!response.ok) {
         throw new Error(`Answer KB failed: ${response.status}`);
      }

      const data = (await response.json()) as {
         answer: string;
         source: string | null;
         matches?: Array<{
            text: string;
            distance: number;
            source: string | null;
         }>;
         response_time_ms?: number;
      };

      return data.answer;
   },
};

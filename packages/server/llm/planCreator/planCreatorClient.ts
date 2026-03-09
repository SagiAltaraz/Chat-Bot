import { da } from 'zod/v4/locales';

const url = 'http://localhost:5001';

export interface PlanParameters {
   city?: string;
   from?: string;
   to?: string;
   amount?: number;
   equation?: string;
   product_name?: string;
   query?: string;
}

export interface PlanStep {
   intent: string;
   parameters: PlanParameters;
}

export interface PlanResponse {
   plan: PlanStep[];
   final_answer_synthesis: string;
}

export const planCreatorClient = {
   /**
    * Sends a user prompt to the Python LLM server,
    * which calls Ollama and returns a structured plan.
    */
   async createPlan(prompt: string): Promise<PlanResponse> {
      const response = await fetch(`${url}/classify`, {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify({ prompt }),
      });

      if (!response.ok) {
         throw new Error(
            `Plan creation failed: ${response.status} ${response.statusText}`
         );
      }

      const data: PlanResponse = (await response.json()) as PlanResponse;

      return data;
   },
};

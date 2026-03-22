import {
   planCreatorClient,
   type PlanResponse,
} from '../llm/planCreator/planCreatorClient.js';

// Re-export types from planCreatorClient for consistency
export type {
   PlanParameters,
   PlanStep,
   PlanResponse,
} from '../llm/planCreator/planCreatorClient.js';

export interface CreatePlanRequest {
   prompt: string;
}

export interface PlanCreationResult {
   success: boolean;
   plan?: PlanResponse;
   error?: string;
}

export const planRepository = {
   /**
    * Creates a plan by sending a prompt to the LLM service
    * @param request - The plan creation request containing the user prompt
    * @returns Promise<PlanCreationResult> - The result of plan creation
    */
   async createPlan(request: CreatePlanRequest): Promise<PlanCreationResult> {
      try {
         if (!request.prompt || request.prompt.trim().length === 0) {
            return {
               success: false,
               error: 'Prompt is required and cannot be empty',
            };
         }

         const plan = await planCreatorClient.createPlan(request.prompt);
         return {
            success: true,
            plan,
         };
      } catch (error) {
         const errorMessage =
            error instanceof Error ? error.message : 'Unknown error occurred';
         return {
            success: false,
            error: `Failed to create plan: ${errorMessage}`,
         };
      }
   },

   /**
    * Legacy method - kept for backward compatibility
    * @deprecated Use createPlan instead
    */
   async getPlans() {
      // This method was originally empty, keeping it for backward compatibility
      // but it doesn't have a clear purpose in the current architecture
      return [];
   },
};

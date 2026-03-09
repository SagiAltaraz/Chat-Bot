import { planRepository } from '../repositories/plan.repository.js';
import type {
   CreatePlanRequest,
   PlanCreationResult,
} from '../repositories/plan.repository.js';

export const planService = {
   /**
    * Creates a plan using the LLM service
    * @param request - The plan creation request
    * @returns Promise<PlanCreationResult> - The result of plan creation
    */
   async createPlan(request: CreatePlanRequest): Promise<PlanCreationResult> {
      const result = await planRepository.createPlan(request);
      return result;
   },

   /**
    * Legacy method - kept for backward compatibility
    * @deprecated Use createPlan instead
    */
   getPlans() {
      return planRepository.getPlans();
   },
};

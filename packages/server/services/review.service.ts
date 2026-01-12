import type { ReviewModel } from '../generated/prisma/models';
import { reviewRepository } from '../repositories/reviw.repository';

export const reviewService = {
   async getReviews(productId: number): Promise<ReviewModel[]> {
      return reviewRepository.getReviews(productId);
   },
};

import type { Request, Response } from 'express';
import { reviewService } from '../services/review.service';
import { reviewRepository } from '../repositories/review.repository';

export const reviewController = {
   async createReview(req: Request, res: Response) {
      const review = await reviewRepository.createReview({
         ...req.body,
         productId: res.locals.productId,
      });

      res.status(201).json({ review });
   },

   async getReviews(req: Request, res: Response) {
      const productId = res.locals.productId;

      const reviews = await reviewRepository.getReviews(productId);
      const summary = await reviewRepository.getReviewSummary(productId);

      res.json({
         reviews,
         summary,
      });
   },

   async summerizeReviews(req: Request, res: Response) {
      const productId = res.locals.productId;

      const reviews = await reviewRepository.getReviews(productId, 1);
      if (!reviews.length)
         return res.status(400).json({ error: 'No reviews found' });

      const summary = await reviewService.summarizeReviews(productId);
      res.json({ summary });
   },
};

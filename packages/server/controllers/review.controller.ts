import type { Request, Response } from 'express';
import { reviewService } from '../services/review.service';
import { productRepository } from '../repositories/product.repository';
import { reviewRepository } from '../repositories/review.repository';

export const reviewController = {
   async getReviews(req: Request, res: Response) {
      const productId = Number(req.params.id);

      if (isNaN(productId)) {
         res.status(400).json({ error: 'invalid productId' });
         return;
      }

      const product = await productRepository.getProductById(productId);
      if (!product) return res.status(404).json({ error: 'Product not found' });

      const reviews = await reviewRepository.getReviews(productId);
      const summary = await reviewRepository.getReviewSummary(productId);

      res.json({
         reviews,
         summary,
      });
   },

   async summerizeReviews(req: Request, res: Response) {
      const productId = Number(req.params.id);

      if (isNaN(productId)) {
         res.status(400).json({ error: 'invalid productId' });
         return;
      }

      const product = await productRepository.getProductById(productId);
      if (!product) return res.status(400).json({ error: 'Product not found' });

      const reviews = await reviewRepository.getReviews(productId, 1);
      if (!reviews.length)
         return res.status(400).json({ error: 'No reviews found' });

      const summary = await reviewService.summarizeReviews(productId);
      res.json({ summary });
   },
};

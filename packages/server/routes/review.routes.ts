import express from 'express';
import { reviewController } from '../controllers/review.controller.js';
import { validateCreateReview } from '../middleware/review.middleware.js';
import {
   requireProduct,
   validateProductId,
} from '../middleware/product.middleware.js';

const router = express.Router();

router.get(
   '/api/products/:id/reviews',
   validateProductId,
   requireProduct,
   reviewController.getReviews
);
router.post(
   '/api/products/:id/reviews',
   validateProductId,
   requireProduct,
   validateCreateReview,
   reviewController.createReview
);
router.post(
   '/api/products/:id/reviews/summarize',
   validateProductId,
   requireProduct,
   reviewController.summerizeReviews
);

export default router;

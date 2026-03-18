import type { Request, Response } from 'express';
import { z } from 'zod';

const createReviewSchema = z.object({
   author: z.string().trim().min(1, 'Author is required'),
   rating: z.coerce
      .number('Rating must be a number')
      .int('Rating must be an integer')
      .min(1, 'Rating must be between 1 and 5')
      .max(5, 'Rating must be between 1 and 5'),
   content: z.string().trim().min(1, 'Content is required'),
});

function sendZodError(res: Response, error: z.ZodError) {
   const message = error.issues[0]?.message ?? 'Invalid request';

   return res.status(400).json({ error: message });
}

export const validateCreateReview = (
   req: Request,
   res: Response,
   next: any
) => {
   const result = createReviewSchema.safeParse(req.body);

   if (!result.success) {
      return sendZodError(res, result.error);
   }

   req.body = result.data;
   next();
};

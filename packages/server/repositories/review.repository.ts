import type { ReviewModel } from '../generated/prisma/models';
import dayjs from 'dayjs';
import { DBConfig } from '../config/DB.config';

const prisma = DBConfig.client;

export const reviewRepository = {
   async getReviews(productId: number, limit?: number): Promise<ReviewModel[]> {
      return prisma.review.findMany({
         where: { productId },
         orderBy: { createdAt: 'desc' },
         take: limit,
      });
   },

   createReview(data: {
      author: string;
      rating: number;
      content: string;
      productId: number;
   }) {
      return prisma.review.create({
         data,
      });
   },

   storeReviewSummary(productId: number, summary: string) {
      const expiresAt = dayjs().add(7, 'days').toDate();
      return prisma.summary.upsert({
         create: {
            content: summary,
            expiresAt: expiresAt,
            productId,
         },
         update: {
            content: summary,
            expiresAt: expiresAt,
         },
         where: { id: productId },
      });
   },
   async getReviewSummary(productId: number): Promise<String | null> {
      const summary = await prisma.summary.findFirst({
         where: {
            AND: [{ productId }, { expiresAt: { gt: new Date() } }],
         },
      });

      return summary?.content ?? null;
   },
};

import type { ReviewModel } from '../generated/prisma/models';
import { PrismaClient } from '../generated/prisma/client';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import dayjs from 'dayjs';

const adapter = new PrismaMariaDb({
   host: process.env.DATABASE_HOST,
   user: process.env.DATABASE_USER,
   password: process.env.DATABASE_PASSWORD,
   database: process.env.DATABASE_NAME,
   connectionLimit: 5,
});

const prisma = new PrismaClient({ adapter });

export const reviewRepository = {
   async getReviews(productId: number, limit?: number): Promise<ReviewModel[]> {
      return prisma.review.findMany({
         where: { productId },
         orderBy: { createdAt: 'desc' },
         take: limit,
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

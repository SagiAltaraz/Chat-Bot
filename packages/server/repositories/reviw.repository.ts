import type { ReviewModel } from '../generated/prisma/models';
import { PrismaClient } from '../generated/prisma/client';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';

export const reviewRepository = {
   async getReviews(productId: number): Promise<ReviewModel[]> {
      const adapter = new PrismaMariaDb({
         host: process.env.DATABASE_HOST,
         user: process.env.DATABASE_USER,
         password: process.env.DATABASE_PASSWORD,
         database: process.env.DATABASE_NAME,
         connectionLimit: 5,
      });

      const prisma = new PrismaClient({ adapter });

      return prisma.review.findMany({
         where: { productId },
         orderBy: { createdAt: 'desc' },
      });
   },
};

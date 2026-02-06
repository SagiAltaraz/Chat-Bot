import { DBConfig } from '../config/DB.config';
import type {
   IntentClassification,
   Prisma,
   Intent,
} from '../generated/prisma/client';

const prisma = DBConfig.client;

export const intentRepository = {
   getIntentByName(slug: string) {
      return prisma.intent.findUnique({ where: { slug } });
   },

   createIntentClassification(data: Prisma.IntentClassificationCreateInput) {
      return prisma.intentClassification.create({ data });
   },
};

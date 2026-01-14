import { DBConfig } from '../config/DB.config';

const prisma = DBConfig.client;

export const productRepository = {
   getProductById(productId: number) {
      return prisma.product.findUnique({
         where: {
            id: productId,
         },
      });
   },
};

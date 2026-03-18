import { DBConfig } from '../config/DB.config';

const prisma = DBConfig.client;

export const productRepository = {
   getProducts() {
      return prisma.product.findMany({
         orderBy: {
            id: 'asc',
         },
      });
   },

   getProductById(productId: number) {
      return prisma.product.findUnique({
         where: {
            id: productId,
         },
      });
   },

   getProductByName(name: string) {
      return prisma.product.findFirst({
         where: {
            name,
         },
      });
   },

   createProduct(data: {
      name: string;
      description?: string | null;
      price: number;
   }) {
      return prisma.product.create({
         data,
      });
   },

   updateProduct(
      productId: number,
      data: {
         name?: string;
         description?: string | null;
         price?: number;
      }
   ) {
      return prisma.product.update({
         where: {
            id: productId,
         },
         data,
      });
   },

   deleteProduct(productId: number) {
      return prisma.$transaction(async (tx) => {
         // Product has dependent summary/review rows, so we remove them first
         // inside the same transaction before deleting the product itself.
         await tx.summary.deleteMany({
            where: {
               productId,
            },
         });
         await tx.review.deleteMany({
            where: {
               productId,
            },
         });
         return tx.product.delete({
            where: {
               id: productId,
            },
         });
      });
   },

   clearProducts() {
      return prisma.$transaction(async (tx) => {
         // The whole table clear follows the same dependency order to avoid
         // foreign-key failures and keep the wipe atomic.
         await tx.summary.deleteMany({});
         await tx.review.deleteMany({});
         const deletedProducts = await tx.product.deleteMany({});

         return deletedProducts;
      });
   },
};

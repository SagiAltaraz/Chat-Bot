import type { Request, Response } from 'express';
import { productRepository } from '../repositories/product.repository';

export const productController = {
   async listProducts(_req: Request, res: Response) {
      const products = await productRepository.getProducts();

      res.json({ products });
   },

   async getProduct(req: Request, res: Response) {
      res.json({ product: res.locals.product });
   },

   async createProduct(req: Request, res: Response) {
      const product = await productRepository.createProduct(req.body);

      res.status(201).json({ product });
   },

   async updateProduct(req: Request, res: Response) {
      const product = await productRepository.updateProduct(
         res.locals.productId,
         req.body
      );

      res.json({ product });
   },

   async deleteProduct(_req: Request, res: Response) {
      await productRepository.deleteProduct(res.locals.productId);

      res.json({
         message: `Product ${res.locals.product.name} deleted successfully`,
      });
   },

   async clearProducts(_req: Request, res: Response) {
      const result = await productRepository.clearProducts();

      res.json({
         message: 'Products table cleared',
         deletedCount: result.count,
      });
   },
};

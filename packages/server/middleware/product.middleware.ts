import type { Request, Response } from 'express';
import { z } from 'zod';
import { productRepository } from '../repositories/product.repository';

const CLEAR_PRODUCTS_PASSWORD = 'admin';

const createProductSchema = z.object({
   name: z.string().trim().min(1, 'Name is required'),
   description: z.string().trim().nullable().optional().default(null),
   price: z.coerce.number('Price must be a number'),
});

const updateProductSchema = z
   .object({
      name: z.string().trim().min(1, 'Name cannot be empty').optional(),
      description: z.string().trim().nullable().optional(),
      price: z.coerce.number('Price must be a number').optional(),
   })
   .refine(
      (data) =>
         data.name !== undefined ||
         data.description !== undefined ||
         data.price !== undefined,
      { message: 'No fields provided to update' }
   );

const clearProductsSchema = z.object({
   password: z.string(),
});

function parseProductId(value: string) {
   const productId = Number(value);

   return Number.isInteger(productId) ? productId : NaN;
}

function sendZodError(res: Response, error: z.ZodError) {
   const message = error.issues[0]?.message ?? 'Invalid request';

   return res.status(400).json({ error: message });
}

// Product id validation belongs in middleware because several routes share
// exactly the same request guard before any controller logic should run.
export const validateProductId = (req: Request, res: Response, next: any) => {
   const productId = parseProductId(String(req.params.id));

   if (isNaN(productId)) {
      return res.status(400).json({ error: 'invalid productId' });
   }

   res.locals.productId = productId;
   next();
};

// Load the product once for routes that require an existing record so the
// controller can work with a known-good entity.
export const requireProduct = async (
   _req: Request,
   res: Response,
   next: any
) => {
   const product = await productRepository.getProductById(res.locals.productId);

   if (!product) {
      return res.status(404).json({ error: 'Product not found' });
   }

   res.locals.product = product;
   next();
};

export const validateCreateProduct = async (
   req: Request,
   res: Response,
   next: any
) => {
   const result = createProductSchema.safeParse(req.body);

   if (!result.success) {
      return sendZodError(res, result.error);
   }

   const existingProduct = await productRepository.getProductByName(
      result.data.name
   );

   if (existingProduct) {
      return res.status(409).json({ error: 'Product already exists' });
   }

   req.body = result.data;
   next();
};

// Update validation is also shared route-level logic: normalize input,
// reject invalid field types, and ensure the request changes at least one field.
export const validateUpdateProduct = (
   req: Request,
   res: Response,
   next: any
) => {
   const result = updateProductSchema.safeParse(req.body);

   if (!result.success) {
      return sendZodError(res, result.error);
   }

   req.body = result.data;
   next();
};

export const validateClearProductsPassword = (
   req: Request,
   res: Response,
   next: any
) => {
   const result = clearProductsSchema.safeParse(req.body);

   if (!result.success) {
      return sendZodError(res, result.error);
   }

   // The destructive "clear all" action is gated before it reaches the
   // controller so business logic only runs on authorized requests.
   if (result.data.password !== CLEAR_PRODUCTS_PASSWORD) {
      return res.status(403).json({ error: 'Invalid password' });
   }

   req.body = result.data;
   next();
};

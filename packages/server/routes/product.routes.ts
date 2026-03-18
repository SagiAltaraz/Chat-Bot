import express from 'express';
import { productController } from '../controllers/product.controller.js';
import {
   requireProduct,
   validateClearProductsPassword,
   validateCreateProduct,
   validateProductId,
   validateUpdateProduct,
} from '../middleware/product.middleware.js';

const router = express.Router();

router.get('/api/products', productController.listProducts);
router.get(
   '/api/products/:id',
   validateProductId,
   requireProduct,
   productController.getProduct
);
router.post(
   '/api/products',
   validateCreateProduct,
   productController.createProduct
);
router.put(
   '/api/products/:id',
   validateProductId,
   requireProduct,
   validateUpdateProduct,
   productController.updateProduct
);
router.delete(
   '/api/products/:id',
   validateProductId,
   requireProduct,
   productController.deleteProduct
);
router.post(
   '/api/products/clear',
   validateClearProductsPassword,
   productController.clearProducts
);

export default router;

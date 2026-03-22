import express from 'express';
import basicRoutes from './routes/basic.routes.js';
import chatRoutes from './routes/chat.routes.js';
import planRoutes from './routes/plan.routes.js';
import productRoutes from './routes/product.routes.js';
import reviewRoutes from './routes/review.routes.js';
import servicesRoutes from './routes/services.routes.js';

const router = express.Router();

router.use(basicRoutes);
router.use(chatRoutes);
router.use(planRoutes);
router.use(productRoutes);
router.use(reviewRoutes);
router.use(servicesRoutes);

export default router;

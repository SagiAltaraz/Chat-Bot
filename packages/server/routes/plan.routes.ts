import express from 'express';
import { planController } from '../controllers/plan.controller.js';

const router = express.Router();

router.post('/api/plan/create', planController.createPlan);

export default router;

import express from 'express';
import { calculateController } from '../controllers/calculate.controller.js';
import { exchangeController } from '../controllers/exchange.controller.js';
import { weatherController } from '../controllers/weather.controller.js';

const router = express.Router();

router.get('/api/weather/:city', weatherController.getWeather);
router.get('/api/calculate/:equation', calculateController.calculateEquation);
router.get('/api/exchangerate/:target', exchangeController.getExchangeRate);

export default router;

import express from 'express';
import type { Request, Response } from 'express';
import { chatController } from './controllers/chat.controller.js';
import { reviewController } from './controllers/review.controller.js';
import { weatherController } from './controllers/weather.controller.js';
import { calculateController } from './controllers/calculate.controller.js';
import { exchangeController } from './controllers/exchange.controller.js';
import { checkPromptMiddleware } from './middleware/checkPrompt.middleware.js';
import { chatMessagesController } from './controllers/chatMessages.controller.js';

const router = express.Router();

router.get('/', (req: Request, res: Response) => {
   res.send('Hello, World!');
});

router.get('/api/hello', (req: Request, res: Response) => {
   res.json({ message: 'Hello from the API!' });
});

router.post(
   '/api/chat',
   checkPromptMiddleware.checkPrompt,
   chatController.sendMassage
);

router.post('/api/getMessages', chatMessagesController.getMessages);

router.get('/api/products/:id/reviews', reviewController.getReviews);
router.post(
   '/api/products/:id/reviews/summarize',
   reviewController.summerizeReviews
);

//Task 1
router.get('/api/weather/:city', weatherController.getWeather);
router.get('/api/calculate/:equation', calculateController.calculateEquation);
router.get('/api/exchangerate/:target', exchangeController.getExchangeRate);

export default router;

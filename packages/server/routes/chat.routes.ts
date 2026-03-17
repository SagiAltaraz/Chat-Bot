import express from 'express';
import { chatController } from '../controllers/chat.controller.js';
import { validatePrompt } from '../middleware/prompt.middleware.js';

const router = express.Router();

// Chat endpoint with comprehensive validation and sanitization
router.post('/api/chat', validatePrompt, chatController.sendMessage);
router.post('/api/chat/history', chatController.getHistory);
router.delete('/api/chat/history', chatController.clearHistory);

export default router;

import type { Request, Response } from 'express';
import { chatService } from '../services/chat.service';
import z from 'zod';

const chatSchema = z.object({
   prompt: z.string().trim().min(1),
   conversationId: z.string(),
});

export const chatController = {
   async sendMassage(req: Request, res: Response) {
      const parseResult = chatSchema.safeParse(req.body);
      if (!parseResult.success) {
         res.status(400).json(z.treeifyError(parseResult.error));
         return;
      }

      const { prompt, conversationId } = req.body;

      try {
         const response = await chatService.sendMessage(prompt, conversationId);
         res.json({ message: response?.content });
      } catch (error) {
         console.error('Controller Error:', error);
         res.status(500).json({ error: 'Internal Server Error' });
      }
   },
};

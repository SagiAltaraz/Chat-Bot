import type { Request, Response } from 'express';
import { conversationRepository } from '../repositories/conversation.repository';
import { assistantService } from '../services/assistant.service';

export const chatController = {
   async sendMessage(req: Request, res: Response) {
      // Validation is now handled by middleware, so we can directly access validated data
      const { prompt, conversationId } = req.body;

      try {
         const response = await assistantService.sendMessage(
            prompt,
            conversationId
         );
         res.json({ message: response });
      } catch (error) {
         console.error('Controller Error:', error);
         res.status(500).json({ error: 'Internal Server Error' });
      }
   },

   async getHistory(req: Request, res: Response) {
      const { conversationId } = req.body;

      if (!conversationId) {
         res.status(400).json({ error: 'conversationId is required' });
         return;
      }

      try {
         const session =
            await conversationRepository.getSession(conversationId);

         if (!session) {
            res.json({ messages: [] });
            return;
         }

         const messages = session.messages.user.flatMap(
            (userMessage, index) => {
               const assistantMessage = session.messages.assistant[index];
               return [
                  { content: userMessage.content, role: 'user' as const },
                  ...(assistantMessage
                     ? [
                          {
                             content: assistantMessage.content,
                             role: 'bot' as const,
                          },
                       ]
                     : []),
               ];
            }
         );

         res.json({ messages });
      } catch (error) {
         console.error('History Controller Error:', error);
         res.status(500).json({ error: 'Internal Server Error' });
      }
   },

   async clearHistory(req: Request, res: Response) {
      const { conversationId } = req.body;

      if (!conversationId) {
         res.status(400).json({ error: 'conversationId is required' });
         return;
      }

      try {
         await conversationRepository.deleteSession(conversationId);
         res.status(204).send();
      } catch (error) {
         console.error('Clear History Controller Error:', error);
         res.status(500).json({ error: 'Internal Server Error' });
      }
   },
};

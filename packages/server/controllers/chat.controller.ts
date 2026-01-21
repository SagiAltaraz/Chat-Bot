import type { Request, Response } from 'express';
import { chatService } from '../services/chat.service';
import { intentService } from '../services/intent.service';
import { exchangeService } from '../services/exchange.service';
import { mathTranslatorService } from '../services/math_translator.service';
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

      try {
         const { prompt, conversationId } = req.body;
         const classification = await intentService.classify(prompt);
         const { intent, parameters } = classification;
         const cookies = req.cookies;
         if (!cookies?.conversationId) {
            res.cookie('conversationId', conversationId);
         }

         let replyMessage = '';

         switch (intent) {
            // case 'calculate':
            //    replyMessage = await mathTranslatorService.calculateFromPrompt(
            //       prompt,
            //       parameters?.equation
            //    );
            //    break;

            case 'chat':
            default:
               const response = await chatService.sendMessage(
                  prompt,
                  conversationId
               );

               replyMessage = String(response?.content);
               break;
         }

         res.json({ message: replyMessage });
         // const response = await chatService.sendMessage(prompt, conversationId);
         // if (!response?.content) {
         //    return res
         //       .status(500)
         //       .json({ error: 'Failed to generate response.' });
         // }
         // res.json({ message: response.content });
      } catch (error) {
         console.error('Controller Error:', error);
         res.status(500).json({ error: 'Internal Server Error' });
      }
   },
};

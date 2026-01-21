import type { Request, Response } from 'express';
import { chatService } from '../services/chat.service';
import { intentService } from '../services/intent.service';
import { weatherService } from '../services/weather.service';
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
         console.log(`[Router] Intent: ${intent}`, parameters);

         let replyMessage = '';

         switch (intent) {
            case 'getWeather':
               if (parameters?.city) {
                  const weather = await weatherService.recieveWeather(
                     parameters.city
                  );
                  replyMessage = `in ${weather.city} is ${weather.temperature} degrees and ${weather.description} weather`;
               } else {
                  replyMessage =
                     'I understood you want weather info, but I missed the city name.';
               }
               break;

            case 'getExchangeRate':
               replyMessage =
                  await exchangeService.convertFromParams(parameters);
               break;

            case 'calculate':
               replyMessage = await mathTranslatorService.calculateFromPrompt(
                  prompt,
                  parameters?.equation
               );
               break;

            case 'chat':
            default:
               const response = await chatService.sendMessage(
                  prompt,
                  conversationId
               );
               replyMessage = response.massage;
               break;
         }

         res.json({ message: replyMessage });
         const cookies = req.cookies;
         if (!cookies?.conversationId) {
            res.cookie('conversationId', conversationId);
         }
         const response = await chatService.sendMessage(prompt, conversationId);
         if (!response?.content) {
            return res
               .status(500)
               .json({ error: 'Failed to generate response.' });
         }
         res.json({ message: response.content });
      } catch (error) {
         console.error('Controller Error:', error);
         res.status(500).json({ error: 'Internal Server Error' });
      }
   },
};

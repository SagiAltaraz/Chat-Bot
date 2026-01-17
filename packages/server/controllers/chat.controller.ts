import type { Request, Response } from 'express';
import { chatService } from '../services/chat.service';
import { intentService } from '../services/intent.service';
import { weatherService } from '../services/weather.service';
import { exchangeService } from '../services/exchange.service';
import { evaluate } from 'mathjs';
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
               {
                  const from =
                     typeof parameters?.from === 'string' &&
                     parameters.from.trim()
                        ? parameters.from
                        : parameters?.target
                          ? 'ILS'
                          : undefined;
                  const to =
                     typeof parameters?.to === 'string' && parameters.to.trim()
                        ? parameters.to
                        : parameters?.target;
                  const amount =
                     typeof parameters?.amount === 'number'
                        ? parameters.amount
                        : undefined;

                  if (to) {
                     const base = from ?? 'ILS';
                     const data = await exchangeService.convertCurrency(
                        base,
                        to,
                        amount ?? 1
                     );
                     replyMessage =
                        amount !== undefined
                           ? `${data.amount} ${data.from} = ${data.result} ${data.to}`
                           : `1 ${data.from} = ${data.rate} ${data.to}`;
                  } else {
                     replyMessage = 'Which currency?';
                  }
               }
               break;

            case 'calculate':
               if (parameters?.equation) {
                  try {
                     const result = evaluate(parameters.equation);
                     replyMessage = `${parameters.equation} = ${result}`;
                  } catch {
                     replyMessage = 'Error calculating.';
                  }
               }
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
      } catch (error) {
         console.error('Controller Error:', error);
         res.status(500).json({ error: 'Internal Server Error' });
      }
   },
};

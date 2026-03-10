import type { Request, Response, NextFunction } from 'express';
import { weatherService } from '../services/weather.service.js';
import { exchangeService } from '../services/exchange.service.js';
import { mathTranslatorService } from '../services/math_translator.service.js';
import { productInformationService } from '../services/productInformation.service.js';
import { chatService } from '../services/chat.service.js';
import { planService } from '../services/plan.service.js';
import { conversationRepository } from '../repositories/conversation.repository.js';
import type { PlanStep } from '../repositories/plan.repository.js';

async function executeStep(
   step: PlanStep,
   conversationId: string
): Promise<string> {
   switch (step.intent) {
      case 'weather': {
         const weather = await weatherService.recieveWeather(
            String(step.parameters.city)
         );
         return `${weather.temperature} degrees`;
      }
      case 'exchange': {
         const result = await exchangeService.getExchangeRate({
            from: String(step.parameters.from),
            to: String(step.parameters.to),
            amount: Number(step.parameters.amount),
         });
         return `${result.result}`;
      }
      case 'calculate': {
         return await mathTranslatorService.calculateFromPrompt(
            step.parameters.equation ?? ''
         );
      }
      case 'products': {
         return await productInformationService.getProductInformation(
            String(step.parameters.product_name ?? ''),
            String(step.parameters.query ?? '')
         );
      }
      case 'general': {
         const query = String(step.parameters.query ?? '');
         if (!query) return '';
         const response = await chatService.sendMessage(query, conversationId);
         return response?.content ?? '';
      }
      default:
         return '';
   }
}

export const chatMiddleware = {
   async classifyMessage(req: Request, res: Response, next: NextFunction) {
      const { prompt, conversationId } = req.body;
      const cookies = req.cookies;
      const result = await planService.createPlan({ prompt });

      if (result.success && result.plan) {
         // If all steps are general intent, let the chatbot (OpenAI) handle it
         const isAllGeneral = result.plan.plan.every(
            (step) => step.intent === 'general'
         );
         if (isAllGeneral) return next();

         // 1. Execute each step and collect results keyed by intent
         const stepResults: string[] = [];
         for (const step of result.plan.plan) {
            stepResults.push(await executeStep(step, conversationId));
         }

         // 2. Replace <placeholders> in the final answer template
         let finalAnswer = result.plan.final_answer_synthesis;

         for (let i = 0; i < stepResults.length; i++) {
            if (stepResults[i]) {
               finalAnswer = finalAnswer.replaceAll(
                  `<result_from_tool_${i + 1}>`,
                  String(stepResults[i])
               );
            }
         }

         // Clean up any unreplaced placeholders (e.g. from general intent)
         finalAnswer = finalAnswer
            .replace(/<result_from_tool_\d+>\./g, '')
            .replace(/<result_from_tool_\d+>/g, '')
            .trim();

         if (!cookies?.conversationId) {
            res.cookie('conversationId', conversationId);
         }

         await conversationRepository.saveSession(conversationId, prompt, {
            id: conversationId,
            text: finalAnswer,
         });

         return res.json({ message: finalAnswer });
      }

      next();
   },
};

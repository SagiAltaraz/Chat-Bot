import type { Request, Response } from 'express';
import { mathTranslatorService } from '../services/math_translator.service';

export const calculateController = {
   async calculateEquation(req: Request, res: Response) {
      const equation = String(req.params.equation ?? '').trim();
      if (!equation)
         return res.status(400).json({ error: 'Equation is required' });

      const result = await mathTranslatorService.calculateFromPrompt(equation);
      res.json({ message: result });
   },
};

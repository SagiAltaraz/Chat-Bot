import type { Request, Response } from 'express';
import { evaluate } from 'mathjs';
import { mathTranslatorService } from '../services/math_translator.service';

export const calculateController = {
   async calculateEquation(req: Request, res: Response) {
      const result = await mathTranslatorService.calculateFromPrompt(
         req.body.prompt
      );
      res.json({ message: result });
   },
};

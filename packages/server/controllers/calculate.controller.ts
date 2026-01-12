import type { Request, Response } from 'express';
import { evaluate } from 'mathjs';

export const calculateController = {
   calculateEquation(req: Request, res: Response) {
      const equation = String(req.params.equation).trim();
      try {
         const result = evaluate(equation);
         res.json({ message: `${equation} = ${result}` });
      } catch (error) {
         res.status(400).json({ error: 'Invalid equation' });
      }
   },
};

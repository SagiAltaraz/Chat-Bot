import type { Request, Response } from 'express';
import e from 'express';
import { evaluate } from 'mathjs';

type apiResponse = {
   rates: Record<string, number>;
};

export const exchangeController = {
   async getExchangeRate(req: Request, res: Response) {
      const responce = await fetch(
         'https://api.frankfurter.dev/v1/latest?base=ILS'
      );
      const data = (await responce.json()) as apiResponse;
      const rate = data.rates[`${req.params.target}`];
      //res.json(evaluate(`1/${rate}`))
      console.log(rate);
      res.json({ message: `${evaluate(`1/${rate}`).toFixed(2)} ILS` });
   },
};

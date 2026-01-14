import { evaluate } from 'mathjs';

type ExchangeApiResponse = {
   rates: Record<string, number>;
};

export type ExchangeRate = {
   rate: number;
   target: string;
};

export const exchangeService = {
   async recieveExchangeRate(target: string): Promise<ExchangeRate> {
      const responce = await fetch(
         'https://api.frankfurter.dev/v1/latest?base=ILS'
      );
      const data = (await responce.json()) as ExchangeApiResponse;
      const rate = evaluate(`1/${String(data.rates[target])}`).toFixed(2);

      return {
         rate,
         target,
      };
   },
};

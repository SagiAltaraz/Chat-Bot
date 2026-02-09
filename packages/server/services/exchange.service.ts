import { evaluate } from 'mathjs';
import { number } from 'zod';

type ExchangeApiResponse = {
   rates: Record<string, number>;
};

export type ExchangeRate = {
   rate: number;
   target: string;
};

export type ExchangeConversion = {
   from: string;
   to: string;
   amount: number;
   rate: number;
   result: number;
};

type ExchangeParams = {
   from?: string;
   to?: string;
   target?: string;
   amount?: number | null;
};

export const exchangeService = {
   async recieveExchangeRate(target: string): Promise<ExchangeRate> {
      const normalizedTarget = target.toUpperCase();
      if (normalizedTarget === 'ILS') {
         return { rate: 1, target: normalizedTarget };
      }

      const responce = await fetch(
         'https://api.frankfurter.dev/v1/latest?base=ILS'
      );
      const data = (await responce.json()) as ExchangeApiResponse;

      const rawRate = data.rates[normalizedTarget];
      if (!rawRate) {
         throw new Error(`Rate not found for ILS to ${normalizedTarget}`);
      }
      const rate = evaluate(`1/${String(rawRate)}`).toFixed(2);

      return {
         rate: Number(rate),
         target: normalizedTarget,
      };
   },

   async convertCurrency(
      from: string,
      to: string,
      amount: number = 1
   ): Promise<ExchangeConversion> {
      const cleanFrom = from.toUpperCase();
      const cleanTo = to.toUpperCase();
      const cleanAmount = Number.isFinite(amount) ? amount : 1;

      if (cleanFrom === cleanTo) {
         return {
            from: cleanFrom,
            to: cleanTo,
            amount: cleanAmount,
            rate: 1,
            result: Number(cleanAmount.toFixed(2)),
         };
      }

      const response = await fetch(
         `https://api.frankfurter.dev/v1/latest?base=${cleanFrom}&symbols=${cleanTo}`
      );
      const data = (await response.json()) as ExchangeApiResponse;
      const rate = data.rates?.[cleanTo];

      if (!rate) {
         throw new Error(`Rate not found for ${cleanFrom} to ${cleanTo}`);
      }

      const result = Number((cleanAmount * rate).toFixed(2));
      return {
         from: cleanFrom,
         to: cleanTo,
         amount: cleanAmount,
         rate,
         result,
      };
   },

   async convertFromParams(params: ExchangeParams | null): Promise<string> {
      const from =
         typeof params?.from === 'string' && params.from.trim()
            ? params.from
            : params?.target
              ? 'ILS'
              : undefined;
      const to =
         typeof params?.to === 'string' && params.to.trim()
            ? params.to
            : params?.target;
      const amount =
         typeof params?.amount === 'number'
            ? params.amount
            : Number(params?.amount);

      if (!to) return 'Which currency?';

      const base = from ?? 'ILS';
      const data = await exchangeService.convertCurrency(base, to, amount ?? 1);

      return amount !== undefined
         ? `${data.amount} ${data.from} = ${data.result} ${data.to}`
         : `1 ${data.from} = ${data.rate} ${data.to}`;
   },
};

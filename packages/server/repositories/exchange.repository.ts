export type ExchangeApiResponse = {
   rates: Record<string, number>;
};

export type ExchangeConversion = {
   from: string;
   to: string;
   amount: number;
   rate: number;
   result: number;
};

export const exchangeRepository = {
   async getExchangeRate(
      from: string,
      to: string,
      amount: number
   ): Promise<ExchangeConversion> {
      const normalizedFrom = from.toUpperCase();
      const normalizedTo = to.toUpperCase();

      if (normalizedFrom === normalizedTo) {
         return {
            from: normalizedFrom,
            to: normalizedTo,
            amount,
            rate: 1,
            result: amount,
         };
      }

      const response = await fetch(
         `https://api.frankfurter.dev/v1/latest?base=${normalizedFrom}&symbols=${normalizedTo}`
      );
      const data = (await response.json()) as ExchangeApiResponse;
      const rate = data.rates?.[normalizedTo];
      if (!rate) {
         throw new Error(
            `Rate not found for ${normalizedFrom} to ${normalizedTo}`
         );
      }
      const result = Number((amount * rate).toFixed(2));
      return {
         from: normalizedFrom,
         to: normalizedTo,
         amount,
         rate,
         result,
      };
   },
};

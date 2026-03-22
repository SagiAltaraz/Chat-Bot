import type { ExchangeConversion } from '../repositories/exchange.repository';
import { exchangeRepository } from '../repositories/exchange.repository';

type ExchangeParams = {
   from?: string;
   to?: string | string[];
   target?: string;
   amount?: number | null;
};

export const exchangeService = {
   getExchangeRate(params: ExchangeParams | null): Promise<ExchangeConversion> {
      const from =
         typeof params?.from === 'string' && params.from.trim()
            ? params.from
            : 'ILS';
      const to =
         typeof params?.to === 'string' && params.to.trim() ? params.to : 'USD';
      const amount =
         typeof params?.amount === 'number'
            ? params.amount
            : Number(params?.amount);

      return exchangeRepository.getExchangeRate(from, to, amount ?? 1);
   },
};

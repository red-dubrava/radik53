import { Injectable } from '@nestjs/common';
import { EmcdService } from './emcd.service';
import { toTH } from '../utils';
import { HttpService } from './http.service';

export interface CoingeckoData {
  readonly bitcoin: {
    readonly rub: number;
  };
}

@Injectable()
export class EmcdMessageService {
  readonly #emcdService: EmcdService;

  readonly #httpService: HttpService;

  constructor(emcdService: EmcdService, httpService: HttpService) {
    this.#emcdService = emcdService;
    this.#httpService = httpService;
  }

  async getBalanceMessage(): Promise<string> {
    const { coins } = await this.#emcdService.getUserData();
    const { coin_id, total_reward } = coins.btc;

    let rub = '';
    try {
      const btcInRub = await this.#convertBtcToRubRate(total_reward);
      const btcInRubFormatted = btcInRub.toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
      rub = `~${btcInRubFormatted} ₽`;
    } catch {
      rub = 'не удалось получить курс BTC к RUB';
    }
    return `Баланс на майнинг пуле: ${total_reward} ${coin_id.toUpperCase()} (${rub})`;
  }

  async getHashrateMessage(): Promise<string> {
    const { total_hashrate } = await this.#emcdService.getWorkers();
    return `Хэшрейт на майнинг пуле: ${toTH(total_hashrate.hashrate)} TH/s`;
  }

  async #convertBtcToRubRate(btc: number): Promise<number> {
    const { bitcoin } = (await this.#httpService.getJson(
      'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=rub',
    )) as CoingeckoData;
    return btc * bitcoin.rub;
  }
}

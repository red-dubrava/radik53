import { Injectable } from '@nestjs/common';
import { EmcdService } from './emcd.service';
import { toTH } from '../utils';

@Injectable()
export class EmcdMessageService {
  readonly #emcdService: EmcdService;

  constructor(emcdService: EmcdService) {
    this.#emcdService = emcdService;
  }

  async getBalanceMessage(): Promise<string> {
    const { coins } = await this.#emcdService.getUserData();
    return `Баланс на майнинг пуле: ${coins.btc.balance} BTC`;
  }

  async getHashrateMessage(): Promise<string> {
    const { total_hashrate } = await this.#emcdService.getWorkers();
    return `Хэшрейт на майнинг пуле: ${toTH(total_hashrate.hashrate)} TH/s`;
  }
}

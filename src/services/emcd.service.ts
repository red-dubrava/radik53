import { Inject, Injectable } from '@nestjs/common';
import { appOptionsProviderKey } from '../keys';
import { join } from 'node:path';
import { HttpService } from './http.service';

export interface EmcdServiceOptions {
  readonly emcdKey: string;
}

export interface IUserData {
  readonly username: string;
  readonly coins: {
    readonly btc: {
      readonly coin_id: string;
      readonly total_paid: number;
      readonly total_reward: number;
    };
  };
}

export interface IWorkersData {
  total_count: { active: number; all: number; dead_count: number; inactive: number };
  total_hashrate: {
    hashrate: number;
    hashrate1h: number;
    hashrate24h: number;
  };
}

@Injectable()
export class EmcdService {
  readonly #key: string;

  readonly #url = 'https://api.emcd.io';

  readonly #httpService: HttpService;

  constructor(@Inject(appOptionsProviderKey) options: EmcdServiceOptions, httpService: HttpService) {
    this.#key = options.emcdKey;
    this.#httpService = httpService;
  }

  async getUserData(): Promise<IUserData> {
    return (await this.#request('v2/info')) as IUserData;
  }

  async getWorkers(): Promise<IWorkersData> {
    return (await this.#request('v1/btc/workers')) as IWorkersData;
  }

  async #request(endpoint: string): Promise<unknown> {
    try {
      const url = join(this.#url, endpoint, this.#key);
      return this.#httpService.getJson(url);
    } catch (error) {
      throw new Error(`EMCD API error`, { cause: error });
    }
  }
}

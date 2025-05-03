import { Inject, Injectable } from '@nestjs/common';
import { appOptionsProviderKey } from '../keys';
import { join } from 'node:path';

export interface EmcdServiceOptions {
  readonly emcdKey: string;
}

export interface IUserData {
  readonly username: string;
  readonly coins: {
    readonly btc: {
      readonly balance: number;
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

  constructor(@Inject(appOptionsProviderKey) options: EmcdServiceOptions) {
    this.#key = options.emcdKey;
  }

  async getUserData(): Promise<IUserData> {
    const response = await this.#request('v2/info');
    return (await response.json()) as IUserData;
  }

  async getWorkers(): Promise<IWorkersData> {
    const response = await this.#request('v1/btc/workers');
    return (await response.json()) as IWorkersData;
  }

  async #request(endpoint: string): Promise<Response> {
    const url = join(this.#url, endpoint, this.#key);
    const response = await fetch(url, { method: 'GET' });

    if (!response.ok) {
      const message = await response.text();
      throw new Error(`EMCD API error: ${message}`);
    }

    return response;
  }
}

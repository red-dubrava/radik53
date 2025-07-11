import { Inject, Injectable } from '@nestjs/common';
import { appOptionsProviderKey } from '../keys';
import { Socket } from 'net';

export const MINER_API_PORT = 4028;

export interface MinerServiceOptions {
  readonly minerIp: string;
}

export interface MinerStatsHeader {
  BMMiner: string;
  Miner: string;
  CompileTime: string;
  Type: string;
}

export interface MinerStatsEntry {
  STATS: number;
  ID: string;
  Elapsed: number;
  Calls: number;
  Wait: number;
  Max: number;
  Min: number;
  'GHS 5s': number;
  'GHS av': number;
  rate_30m: number;
  Mode: number;
  miner_count: number;
  frequency: number;
  fan_num: number;
  fan1: number;
  fan2: number;
  fan3: number;
  fan4: number;
  temp_num: number;
  temp1: number;
  temp2: number;
  temp2_1: number;
  temp2_2: number;
  temp2_3: number;
  temp3: number;
  temp_pcb1: string;
  temp_pcb2: string;
  temp_pcb3: string;
  temp_pcb4: string;
  temp_chip1: string;
  temp_chip2: string;
  temp_chip3: string;
  temp_chip4: string;
  temp_pic1: string;
  temp_pic2: string;
  temp_pic3: string;
  temp_pic4: string;
  total_rateideal: number;
  rate_unit: string;
  total_freqavg: number;
  total_acn: number;
  'total rate': number;
  temp_max: number;
  no_matching_work: number;
  chain_acn1: number;
  chain_acn2: number;
  chain_acn3: number;
  chain_acn4: number;
  chain_acs1: string;
  chain_acs2: string;
  chain_acs3: string;
  chain_acs4: string;
  chain_hw1: number;
  chain_hw2: number;
  chain_hw3: number;
  chain_hw4: number;
  chain_rate1: string;
  chain_rate2: string;
  chain_rate3: string;
  chain_rate4: string;
  freq1: number;
  freq2: number;
  freq3: number;
  freq4: number;
  miner_version: string;
  miner_id: string;
}

export interface MinerStatsResponse {
  STATUS: Array<{
    STATUS: string;
    When: number;
    Code: number;
    Msg: string;
    Description: string;
  }>;
  STATS: [MinerStatsHeader, MinerStatsEntry];
  id: number;
}

@Injectable()
export class MinerService {
  #minerIp: string;

  constructor(@Inject(appOptionsProviderKey) options: MinerServiceOptions) {
    this.#minerIp = options.minerIp;
  }

  async getTemperature(): Promise<number> {
    // summary
    // devs
    // stats
    const statsData = await this.#sendCommand({ command: 'summary' });

    console.log(statsData);

    // const stats = statsData.STATS?.[1];

    // if (!stats) {
    //   throw new Error('Invalid STATS data');
    // }

    // console.log(stats);

    const chipTemps: number[] = [];

    // for (let i = 1; i <= 4; i++) {
    //   const field = stats[`temp_chip${i}`];
    //   if (typeof field === 'string' && field !== '0-0-0-0') {
    //     const parts = field
    //       .split('-')
    //       .map((s) => parseInt(s, 10))
    //       .filter((n) => !isNaN(n));
    //     if (parts.length > 0) {
    //       chipTemps.push(Math.max(...parts));
    //     }
    //   }
    // }

    // if (chipTemps.length === 0) {
    //   throw new Error('No valid chip temperatures found');
    // }

    const average = chipTemps.reduce((sum, t) => sum + t, 0) / chipTemps.length;
    return average;
  }

  #sendCommand(payload: object): Promise<MinerStatsResponse> {
    return new Promise((resolve, reject) => {
      const client = new Socket();
      let result = '';

      client.connect(MINER_API_PORT, this.#minerIp, () => {
        client.write(JSON.stringify(payload));
      });

      client.on('data', (data: Buffer) => {
        result += data.toString();
      });

      client.on('end', () => {
        try {
          // eslint-disable-next-line no-control-regex
          const cleanResult = result.replace(/\x00+$/g, '').trim();
          resolve(JSON.parse(cleanResult) as MinerStatsResponse);
        } catch {
          reject(new Error('Failed to parse miner response'));
        }
      });

      client.on('error', (err: Error) => {
        reject(new Error(`Miner socket error: ${err.message}`));
      });

      client.on('timeout', () => {
        client.destroy();
        reject(new Error('Miner socket timeout'));
      });

      client.setTimeout(5_000);
    });
  }
}

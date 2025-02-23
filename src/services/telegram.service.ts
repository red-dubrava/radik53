import { Inject, Injectable } from '@nestjs/common';
import { Telegraf } from 'telegraf';
import { telegrafProviderKey } from '../keys';

export const data = {
  temperature: 'null',
};

export interface Stats {
  /** Температура чипов (°C) */
  temp_chip: number;
  /** Температура платы (°C) */
  temp_pcb: number;
  /** Обороты первого вентилятора (RPM) */
  fan1: number;
  /** Обороты второго вентилятора (RPM) */
  fan2: number;
  /** Частота чипов (MHz) */
  frequency: number;
  /** Время работы (сек) */
  elapsed: number;
  /** Температура (°C) */
  temperature?: string;
}

@Injectable()
export class TelegramService {
  #telegraf: Telegraf;

  constructor(@Inject(telegrafProviderKey) telegraf: Telegraf) {
    this.#telegraf = telegraf;
  }

  async sendStats(chatId: number): Promise<void> {
    const message = `Температура: ${data.temperature}\n`;
    try {
      await this.#telegraf.telegram.sendMessage(chatId, message);
    } catch (error) {
      console.error(`Ошибка отправки сообщения в чат ${chatId}:`, error);
    }
  }

  async saveStats(stats: Stats): Promise<void> {
    console.log('stats', stats);
    data.temperature = String(stats.temp_chip ?? stats.temperature);
    await Promise.resolve();
  }
}

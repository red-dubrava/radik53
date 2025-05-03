import { mkdir, readFile, writeFile } from 'node:fs/promises';
import * as path from 'node:path';

import { Inject, Injectable, OnModuleInit } from '@nestjs/common';

import { Telegraf } from 'telegraf';

import { telegrafProviderKey } from '../keys';
import { EmcdService } from './emcd.service';
import { message } from 'telegraf/filters';
import { toTH } from 'src/utils';

const CHECK_INTERVAL = 5 * 60 * 1_000;

const HASHRATE_CHANGE_THRESHOLD = 10;

interface WorkerServiceStore {
  activeWorkers: number;
  currentHashrate: number;
  chats: number[];
}

const dataPath = path.resolve(__dirname, '../../data/worker-store.json');

@Injectable()
export class WorkerService implements OnModuleInit {
  readonly #emcdService: EmcdService;

  readonly #telegraf: Telegraf;

  readonly #store = {
    activeWorkers: 0,
    currentHashrate: 0,
    chats: new Set<number>(),
  };

  constructor(emcdService: EmcdService, @Inject(telegrafProviderKey) telegraf: Telegraf) {
    this.#emcdService = emcdService;
    this.#telegraf = telegraf;
  }

  async onModuleInit() {
    setInterval(() => {
      this.#checkWorkers().catch((error) => {
        console.error('Ошибка в checkWorkers:', error);
      });
    }, CHECK_INTERVAL);

    this.#telegraf.on(message('new_chat_members'), async (ctx) => {
      const { botInfo, message, chat } = ctx;
      const botId = botInfo?.id;
      if (message.new_chat_members.find((member) => member.id === botId)) {
        this.#store.chats.add(chat.id);
        await this.#saveStore();
      }
    });

    this.#telegraf.on(message('left_chat_member'), async (ctx) => {
      const { botInfo, message, chat } = ctx;
      if (message.left_chat_member.id === botInfo?.id) {
        this.#store.chats.delete(chat.id);
        await this.#saveStore();
      }
    });

    await this.#loadStore();
  }

  async #checkWorkers() {
    const { total_count, total_hashrate } = await this.#emcdService.getWorkers();
    await this.#checkCount(total_count);
    await this.#checkHashrate(total_hashrate);
  }

  async #checkCount({ active }: { active: number }) {
    const { activeWorkers } = this.#store;

    if (active === activeWorkers) return;

    const diff = active - activeWorkers;
    const sign = diff > 0 ? '+' : '';

    await this.#sendMessage(`🧑‍💻 Активные воркеры: ${activeWorkers} → ${active} (${sign}${diff})`);

    this.#store.activeWorkers = active;

    await this.#saveStore();
  }

  async #checkHashrate({ hashrate }: { hashrate: number }) {
    const { currentHashrate } = this.#store;

    const changePercent = Math.min(100, Math.abs((hashrate - currentHashrate) / currentHashrate) * 100);

    if (changePercent < HASHRATE_CHANGE_THRESHOLD) return;

    const prev = toTH(currentHashrate);
    const curr = toTH(hashrate);
    const diff = toTH(hashrate - currentHashrate);
    const sign = hashrate > currentHashrate ? '+' : '';

    await this.#sendMessage(`⚡️ Хешрейт: ${prev} TH/s → ${curr} TH/s (${sign}${diff} TH/s, ${changePercent.toFixed(1)}%)`);

    this.#store.currentHashrate = hashrate;

    await this.#saveStore();
  }

  async #sendMessage(message: string) {
    const { telegram } = this.#telegraf;

    for (const chatId of this.#store.chats) {
      try {
        await telegram.sendMessage(chatId, message);
      } catch (error) {
        console.error(`❌ Не удалось отправить в ${chatId}:`, error);
      }
    }
  }

  async #saveStore() {
    const data: WorkerServiceStore = {
      activeWorkers: this.#store.activeWorkers,
      currentHashrate: this.#store.currentHashrate,
      chats: Array.from(this.#store.chats),
    };

    try {
      await mkdir(path.dirname(dataPath), { recursive: true });
      await writeFile(dataPath, JSON.stringify(data, null, 2));
    } catch (error) {
      console.error('Ошибка при сохранении store:', error);
    }
  }

  async #loadStore() {
    try {
      const raw = await readFile(dataPath, 'utf-8');
      const parsed = JSON.parse(raw) as WorkerServiceStore;

      this.#store.activeWorkers = parsed.activeWorkers;
      this.#store.currentHashrate = parsed.currentHashrate;
      this.#store.chats = new Set(parsed.chats);
    } catch (error) {
      console.warn(`Store не найден или поврежден — будет создан заново\n${error}`);
    }
  }
}

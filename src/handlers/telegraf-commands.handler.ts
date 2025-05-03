import { Inject, Injectable } from '@nestjs/common';
import { TelegramService } from '@radik53/services';
import { telegrafSheetsProviderKey, telegrafProviderKey, miningPoolMessageServiceProviderKey } from '../keys';
import { Markup, Telegraf } from 'telegraf';
import { MiningPoolMessageService, TelegrafSheetsService } from './types';

@Injectable()
export class TelegrafCommandsHandler {
  readonly #telegraf: Telegraf;

  readonly #telegramService: TelegramService;

  readonly #telegrafSheetsService: TelegrafSheetsService;

  readonly #miningPoolMessageService: MiningPoolMessageService;

  constructor(
    telegramService: TelegramService,
    @Inject(telegrafProviderKey) telegraf: Telegraf,
    @Inject(telegrafSheetsProviderKey) telegrafSheetsService: TelegrafSheetsService,
    @Inject(miningPoolMessageServiceProviderKey) miningPoolMessageService: MiningPoolMessageService,
  ) {
    this.#telegraf = telegraf;
    this.#telegramService = telegramService;
    this.#telegrafSheetsService = telegrafSheetsService;
    this.#miningPoolMessageService = miningPoolMessageService;
  }

  onModuleInit(): void {
    this.#telegraf.command(['expenses'], async (ctx) => {
      const message = await this.#telegrafSheetsService.createExpensesMessage();
      await ctx.reply(message);
    });

    this.#telegraf.command(['income'], async (ctx) => {
      const message = await this.#telegrafSheetsService.createIncomeMessage();
      await ctx.reply(message);
    });

    this.#telegraf.command(['investment'], async (ctx) => {
      const message = await this.#telegrafSheetsService.createInvestmentMessage(ctx.message.text);
      await ctx.reply(message);
    });

    this.#telegraf.command(['profit'], async (ctx) => {
      const message = await this.#telegrafSheetsService.createProfitMessage();
      await ctx.reply(message);
    });

    this.#telegraf.command(['fund'], async (ctx) => {
      const message = await this.#telegrafSheetsService.createFundMessage();
      await ctx.reply(message);
    });

    this.#telegraf.command(['stats'], async (ctx) => {
      const chatId = ctx.chat?.id;
      if (chatId) {
        await this.#telegramService.sendStats(chatId);
      }
    });

    this.#telegraf.command(['balance'], async (ctx) => {
      const chatId = ctx.chat?.id;
      if (chatId) {
        const message = await this.#miningPoolMessageService.getBalanceMessage();
        await ctx.reply(message);
      }
    });

    this.#telegraf.command(['hashrate'], async (ctx) => {
      const chatId = ctx.chat?.id;
      if (chatId) {
        const message = await this.#miningPoolMessageService.getHashrateMessage();
        await ctx.reply(message);
      }
    });

    this.#telegraf.command(['help', 'h'], async (ctx) => {
      await ctx.reply(
        'Доступные команды:',
        Markup.inlineKeyboard([
          [Markup.button.callback('Общий доход (income)', 'income')],
          [Markup.button.callback('Общие затраты (expenses)', 'expenses')],
          [Markup.button.callback('Общие вложения (investment)', 'investment ')],
          [Markup.button.callback('Вложение "Саша" (investment Саша)', 'investment Саша')],
          [Markup.button.callback('Вложение "Миша" (investment Миша)', 'investment Миша')],
          [Markup.button.callback('Вложение "Сергей" (investment Сергей)', 'investment Сергей')],
          [Markup.button.callback('Прибыль (profit)', 'profit')],
          [Markup.button.callback('Фонд (fund)', 'fund')],
          [Markup.button.callback('Баланс на майнинг пуле (balance)', 'balance')],
          [Markup.button.callback('Хэшрейт на майнинг пуле (hashrate)', 'hashrate')],
        ]),
      );
    });

    void this.#telegraf.launch();
  }
}

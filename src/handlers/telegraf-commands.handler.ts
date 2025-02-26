import { Inject, Injectable } from '@nestjs/common';
import { TelegramService } from '@radik53/services';
import { telegrafSheetsProviderKey, telegrafProviderKey } from '../keys';
import { Markup, Telegraf } from 'telegraf';
import { TelegrafSheetsService } from './types';

@Injectable()
export class TelegrafCommandsHandler {
  readonly #telegraf: Telegraf;

  readonly #telegramService: TelegramService;

  readonly #telegrafSheetsService: TelegrafSheetsService;

  constructor(
    @Inject(telegrafProviderKey) telegraf: Telegraf,
    @Inject(telegrafSheetsProviderKey) telegrafSheetsService: TelegrafSheetsService,
    telegramService: TelegramService,
  ) {
    this.#telegraf = telegraf;
    this.#telegramService = telegramService;
    this.#telegrafSheetsService = telegrafSheetsService;
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
        ]),
      );
    });

    void this.#telegraf.launch();
  }
}

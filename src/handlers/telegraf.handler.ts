import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { Markup, Telegraf } from 'telegraf';
import { message } from 'telegraf/filters';
import { telegrafProviderKey, appOptionsProviderKey } from '../keys';
import { GoogleSheetsService, TelegramService } from '@radik53/services';
import { TelegrafHelpers } from './telegraf.helpers';

export interface TelegrafHandlerOptions {
  accountingSpreadsheetId: string;
}

@Injectable()
export class TelegrafHandler implements OnModuleInit {
  #telegraf: Telegraf;
  #telegramService: TelegramService;
  #helpers: TelegrafHelpers;

  constructor(
    @Inject(telegrafProviderKey) telegraf: Telegraf,
    telegramService: TelegramService,
    googleSheetsService: GoogleSheetsService,
    @Inject(appOptionsProviderKey) private readonly options: TelegrafHandlerOptions,
  ) {
    this.#telegraf = telegraf;
    this.#telegramService = telegramService;
    this.#helpers = new TelegrafHelpers(googleSheetsService, options.accountingSpreadsheetId);
  }

  onModuleInit(): void {
    this.#telegraf.on(message('new_chat_members'), (ctx) => {
      const { botInfo, message, chat } = ctx;
      const botId = botInfo?.id;
      if (message.new_chat_members.some((member) => member.id === botId)) {
        console.log(`Бот добавлен в чат: ${chat.id}`);
      }
    });

    this.#telegraf.on(message('left_chat_member'), (ctx) => {
      const { botInfo, message, chat } = ctx;
      if (message.left_chat_member.id === botInfo?.id) {
        console.log(`Бот удалён из чата: ${chat.id}`);
      }
    });

    this.#telegraf.command(['расходы'], async (ctx) => {
      const message = await this.#helpers.createExpensesMessage();
      await ctx.reply(message);
    });

    this.#telegraf.command(['доход'], async (ctx) => {
      const message = await this.#helpers.createIncomeMessage();
      await ctx.reply(message);
    });

    this.#telegraf.command(['инвестиции'], async (ctx) => {
      const message = await this.#helpers.createInvestmentMessage(ctx.message.text);
      await ctx.reply(message);
    });

    this.#telegraf.command(['profit'], async (ctx) => {
      const message = await this.#helpers.createProfitMessage();
      await ctx.reply(message);
    });

    this.#telegraf.command(['fund'], async (ctx) => {
      const message = await this.#helpers.createFundMessage();
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
          [Markup.button.callback('Общий доход', 'income')],
          [Markup.button.callback('Общие затраты', 'expenses')],
          [Markup.button.callback('Общие вложения', 'investment ')],
          [Markup.button.callback('Общие вложения "Миша"', 'investment Миша')],
          [Markup.button.callback('Общие вложения "Саша"', 'investment Саша')],
          [Markup.button.callback('Общие вложения "Сергей"', 'investment Сергей')],
          [Markup.button.callback('Прибыль', 'profit')],
          [Markup.button.callback('Фонд', 'fund')],
          [Markup.button.callback('Фонд', 'fund')],
        ]),
      );
    });

    this.#telegraf.action(['expenses'], async (ctx) => {
      const message = await this.#helpers.createExpensesMessage();
      await ctx.answerCbQuery();
      await ctx.reply(message);
    });

    this.#telegraf.action(['income'], async (ctx) => {
      const message = await this.#helpers.createIncomeMessage();
      await ctx.answerCbQuery();
      await ctx.reply(message);
    });

    this.#telegraf.action([/investment (.+)?/], async (ctx) => {
      if (ctx.callbackQuery && 'data' in ctx.callbackQuery) {
        // Добавляем проверку
        const { data } = ctx.callbackQuery;
        const message = await this.#helpers.createInvestmentMessage(data);
        await ctx.answerCbQuery();
        await ctx.reply(message);
      }
    });

    this.#telegraf.action(['profit'], async (ctx) => {
      const message = await this.#helpers.createProfitMessage();
      await ctx.answerCbQuery();
      await ctx.reply(message);
    });

    this.#telegraf.action(['fund'], async (ctx) => {
      const message = await this.#helpers.createFundMessage();
      await ctx.answerCbQuery();
      await ctx.reply(message);
    });

    void this.#telegraf.launch();
  }
}

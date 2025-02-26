import { Inject, Injectable } from '@nestjs/common';
import { telegrafSheetsProviderKey, telegrafProviderKey } from '../keys';
import { Context, Telegraf } from 'telegraf';
import { TelegrafSheetsService } from './types';

const capitalizeFirstLetter = (str: string) => {
  if (str.length === 0) return str;
  return str[0].toLowerCase() + str.slice(1);
};

@Injectable()
export class TelegrafActionsHandler {
  readonly #telegraf: Telegraf;

  readonly #telegrafSheetsService: TelegrafSheetsService;

  constructor(@Inject(telegrafProviderKey) telegraf: Telegraf, @Inject(telegrafSheetsProviderKey) telegrafSheetsService: TelegrafSheetsService) {
    this.#telegraf = telegraf;
    this.#telegrafSheetsService = telegrafSheetsService;
  }

  onModuleInit(): void {
    this.#telegraf.action(['expenses'], async (ctx) => {
      if (!(await this.#isChatMember(ctx))) return;
      const { first_name } = ctx.from;
      const message = await this.#telegrafSheetsService.createExpensesMessage();
      await ctx.answerCbQuery();
      await ctx.reply(`${first_name}, ${capitalizeFirstLetter(message)}`);
    });

    this.#telegraf.action(['income'], async (ctx) => {
      if (!(await this.#isChatMember(ctx))) return;
      const { first_name } = ctx.from;
      const message = await this.#telegrafSheetsService.createIncomeMessage();
      await ctx.answerCbQuery();
      await ctx.reply(`${first_name}, ${capitalizeFirstLetter(message)}`);
    });

    this.#telegraf.action([/investment (.+)?/], async (ctx) => {
      if (!(await this.#isChatMember(ctx))) return;
      const { first_name } = ctx.from;
      if (ctx.callbackQuery && 'data' in ctx.callbackQuery) {
        const { data } = ctx.callbackQuery;
        const message = await this.#telegrafSheetsService.createInvestmentMessage(data);
        await ctx.answerCbQuery();
        await ctx.reply(`${first_name}, ${capitalizeFirstLetter(message)}`);
      }
    });

    this.#telegraf.action(['profit'], async (ctx) => {
      if (!(await this.#isChatMember(ctx))) return;
      const { first_name } = ctx.from;
      const message = await this.#telegrafSheetsService.createProfitMessage();
      await ctx.answerCbQuery();
      await ctx.reply(`${first_name}, ${capitalizeFirstLetter(message)}`);
    });

    this.#telegraf.action(['fund'], async (ctx) => {
      if (!(await this.#isChatMember(ctx))) return;
      const { first_name } = ctx.from;
      const message = await this.#telegrafSheetsService.createFundMessage();
      await ctx.answerCbQuery();
      await ctx.reply(`${first_name}, ${capitalizeFirstLetter(message)}`);
    });
  }

  async #isChatMember(ctx: Context): Promise<boolean> {
    const chatId = ctx.chat?.id;
    const botId = ctx.botInfo?.id;
    if (!chatId || !botId) return false;
    try {
      await ctx.telegram.getChatMember(chatId, botId);
      return true;
    } catch {
      return false;
    }
  }
}

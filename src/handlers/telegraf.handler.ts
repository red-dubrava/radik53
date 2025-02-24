import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { Context, Markup, Telegraf } from 'telegraf';
import { message } from 'telegraf/filters';
import { telegrafProviderKey, appOptionsProviderKey } from '../keys';
import { GoogleSheetsService, TelegramService } from '@radik53/services';

export interface TelegrafHandlerOptions {
  accountingSpreadsheetId: string;
}

const SHEET_NAME = 'Лист1';

const INVESTMENT_COLUMN = 'G';
const EXPENSES_COLUMN = 'N';
const INCOME_COLUMN = 'Q';

const FUND_CELL = 'C3';
const PROFIT_CELL = 'C4';

const columnsMap = new Map<string, string>([
  ['Саша', 'D'],
  ['Миша', 'E'],
  ['Сергей', 'F'],
]);

const capitalizeFirstLetter = (str: string) => {
  if (str.length === 0) return str;
  return str[0].toLowerCase() + str.slice(1);
};

@Injectable()
export class TelegrafHandler implements OnModuleInit {
  #options: TelegrafHandlerOptions;

  #telegraf: Telegraf;

  #telegramService: TelegramService;

  #googleSheetsService: GoogleSheetsService;

  constructor(
    @Inject(appOptionsProviderKey) options: TelegrafHandlerOptions,
    @Inject(telegrafProviderKey) telegraf: Telegraf,
    telegramService: TelegramService,
    googleSheetsService: GoogleSheetsService,
  ) {
    this.#options = options;
    this.#telegraf = telegraf;
    this.#telegramService = telegramService;
    this.#googleSheetsService = googleSheetsService;
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

    this.#telegraf.command(['expenses'], async (ctx) => {
      const message = await this.#createExpensesMessage();
      await ctx.reply(message);
    });
    this.#telegraf.command(['income'], async (ctx) => {
      const message = await this.#createIncomeMassage();
      await ctx.reply(message);
    });

    this.#telegraf.command(['investment'], async (ctx) => {
      const message = await this.#createInvestmentMessage(ctx.message.text);
      await ctx.reply(message);
    });

    this.#telegraf.command(['profit'], async (ctx) => {
      const message = await this.#createProfitMassage();
      await ctx.reply(message);
    });

    this.#telegraf.command(['fund'], async (ctx) => {
      const message = await this.#createFundMassage();
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

    this.#telegraf.action(['expenses'], async (ctx) => {
      if (!(await this.isChatMember(ctx))) return;
      const { first_name } = ctx.from;
      const message = await this.#createExpensesMessage();
      await ctx.answerCbQuery();
      await ctx.reply(`${first_name}, ${capitalizeFirstLetter(message)}`);
    });

    this.#telegraf.action(['income'], async (ctx) => {
      if (!(await this.isChatMember(ctx))) return;
      const { first_name } = ctx.from;
      const message = await this.#createIncomeMassage();
      await ctx.answerCbQuery();
      await ctx.reply(`${first_name}, ${capitalizeFirstLetter(message)}`);
    });

    this.#telegraf.action([/investment (.+)?/], async (ctx) => {
      if (!(await this.isChatMember(ctx))) return;
      if (!('data' in ctx.callbackQuery) || typeof ctx.callbackQuery.data !== 'string') return;
      const { first_name } = ctx.from;
      const message = await this.#createInvestmentMessage(ctx.callbackQuery.data);
      await ctx.answerCbQuery();
      await ctx.reply(`${first_name}, ${capitalizeFirstLetter(message)}`);
    });

    this.#telegraf.action(['profit'], async (ctx) => {
      if (!(await this.isChatMember(ctx))) return;
      const { first_name } = ctx.from;
      const message = await this.#createProfitMassage();
      await ctx.answerCbQuery();
      await ctx.reply(`${first_name}, ${capitalizeFirstLetter(message)}`);
    });

    this.#telegraf.action(['fund'], async (ctx) => {
      if (!(await this.isChatMember(ctx))) return;
      const { first_name } = ctx.from;
      const message = await this.#createFundMassage();
      await ctx.answerCbQuery();
      await ctx.reply(`${first_name}, ${capitalizeFirstLetter(message)}`);
    });

    void this.#telegraf.launch();
  }

  async isChatMember(ctx: Context): Promise<boolean> {
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

  async #createInvestmentMessage(text = ''): Promise<string> {
    const { accountingSpreadsheetId } = this.#options;
    const name = text.split(' ').slice(1).join(' ');
    const column = columnsMap.get(name) ?? INVESTMENT_COLUMN;
    const row = '31'; // TODO: вычислить значение
    try {
      const values = await this.#googleSheetsService.getData(accountingSpreadsheetId, `${SHEET_NAME}!${column + row}`);
      const [investment] = values.flat();
      const text = name ? `Сумма вложений "${name}"` : 'Общая сумма вложений';
      return `${text}: ${investment.trim()}`;
    } catch (error) {
      console.error(error);
      return 'Ошибка при получении данных из таблицы.';
    }
  }

  async #createExpensesMessage(): Promise<string> {
    const { accountingSpreadsheetId } = this.#options;
    const column = EXPENSES_COLUMN;
    const row = '31'; // TODO: вычислить значение
    try {
      const values = await this.#googleSheetsService.getData(accountingSpreadsheetId, `${SHEET_NAME}!${column + row}`);
      const [expenses] = values.flat();
      const message = 'Общая сумма затрат';
      return `${message}: ${expenses.trim()}`;
    } catch (error) {
      console.error(error);
      return 'Ошибка при получении данных из таблицы.';
    }
  }

  async #createIncomeMassage(): Promise<string> {
    const { accountingSpreadsheetId } = this.#options;
    const column = INCOME_COLUMN;
    const row = '31'; // TODO: вычислить значение
    try {
      const values = await this.#googleSheetsService.getData(accountingSpreadsheetId, `${SHEET_NAME}!${column + row}`);
      const [income] = values.flat();
      const message = 'Общий доход';
      return `${message}: ${income.trim()}`;
    } catch (error) {
      console.error(error);
      return 'Ошибка при получении данных из таблицы.';
    }
  }

  async #createProfitMassage(): Promise<string> {
    const { accountingSpreadsheetId } = this.#options;
    try {
      const values = await this.#googleSheetsService.getData(accountingSpreadsheetId, `${SHEET_NAME}!${PROFIT_CELL}`);
      const [income] = values.flat();
      const message = 'Прибыль';
      return `${message}: ${income.trim()}`;
    } catch (error) {
      console.error(error);
      return 'Ошибка при получении данных из таблицы.';
    }
  }

  async #createFundMassage(): Promise<string> {
    const { accountingSpreadsheetId } = this.#options;
    try {
      const values = await this.#googleSheetsService.getData(accountingSpreadsheetId, `${SHEET_NAME}!${FUND_CELL}`);
      const [income] = values.flat();
      const message = 'Денег в банке (фонд)';
      return `${message}: ${income.trim()}`;
    } catch (error) {
      console.error(error);
      return 'Ошибка при получении данных из таблицы.';
    }
  }
}

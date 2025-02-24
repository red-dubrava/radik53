// telegraf.handler.ts
import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { Telegraf, Context } from 'telegraf';
import { telegrafProviderKey, appOptionsProviderKey } from '../keys';
import { GoogleSheetsService } from '@radik53/services';
import { handleExpenses, handleIncome, handleInvestment, handleProfit, handleFund, handleHelp } from './telegraf.commands';
import { handleActionExpenses, handleActionIncome, handleActionInvestment, handleActionProfit, handleActionFund } from './telegraf.actions';

@Injectable()
export class TelegrafHandler implements OnModuleInit {
  constructor(
    @Inject(telegrafProviderKey) private readonly telegraf: Telegraf<Context>,
    @Inject(appOptionsProviderKey) private readonly options: { accountingSpreadsheetId: string },
    private readonly googleSheetsService: GoogleSheetsService,
  ) {}

  onModuleInit(): void {
    // Команды
    this.telegraf.command('expenses', async (ctx) => handleExpenses(ctx, this.googleSheetsService, this.options.accountingSpreadsheetId));

    this.telegraf.command('income', async (ctx) => handleIncome(ctx, this.googleSheetsService, this.options.accountingSpreadsheetId));

    this.telegraf.command('investment', async (ctx) => {
      if (ctx.message?.text) {
        await handleInvestment(ctx, this.googleSheetsService, this.options.accountingSpreadsheetId, ctx.message.text);
      }
    });

    this.telegraf.command('profit', async (ctx) => handleProfit(ctx, this.googleSheetsService, this.options.accountingSpreadsheetId));

    this.telegraf.command('fund', async (ctx) => handleFund(ctx, this.googleSheetsService, this.options.accountingSpreadsheetId));

    this.telegraf.command(['help', 'h'], async (ctx) => handleHelp(ctx));

    // Действия (кнопки)
    this.telegraf.action('expenses', async (ctx) => handleActionExpenses(ctx, this.googleSheetsService, this.options.accountingSpreadsheetId));

    this.telegraf.action('income', async (ctx) => handleActionIncome(ctx, this.googleSheetsService, this.options.accountingSpreadsheetId));

    this.telegraf.action(/investment (.+)?/, async (ctx) =>
      handleActionInvestment(ctx, this.googleSheetsService, this.options.accountingSpreadsheetId),
    );

    this.telegraf.action('profit', async (ctx) => handleActionProfit(ctx, this.googleSheetsService, this.options.accountingSpreadsheetId));

    this.telegraf.action('fund', async (ctx) => handleActionFund(ctx, this.googleSheetsService, this.options.accountingSpreadsheetId));

    // Запуск бота
    void this.telegraf.launch();
  }
}

import { Inject, Injectable } from '@nestjs/common';
import { TelegrafSheetsService } from '@radik53/handlers';

import { GoogleSheetsService } from './google-sheets.service';
import { appOptionsProviderKey } from '../keys';

const SHEET_NAME = 'Лист1';

const INVESTMENT_COLUMN = 'G';
const EXPENSES_COLUMN = 'N';
const INCOME_COLUMN = 'Q';

const FUND_CELL = 'C3';
const PROFIT_CELL = 'C4';

export interface TelegrafHelperServiceOptions {
  accountingSpreadsheetId: string;
}

const columnsMap = new Map<string, string>([
  ['Саша', 'D'],
  ['Миша', 'E'],
  ['Сергей', 'F'],
]);

@Injectable()
export class SheetsQueryService implements TelegrafSheetsService {
  readonly #options: TelegrafHelperServiceOptions;

  readonly #googleSheetsService: GoogleSheetsService;

  constructor(@Inject(appOptionsProviderKey) options: TelegrafHelperServiceOptions, googleSheetsService: GoogleSheetsService) {
    this.#options = options;
    this.#googleSheetsService = googleSheetsService;
  }

  async createExpensesMessage(): Promise<string> {
    const { accountingSpreadsheetId } = this.#options;
    const column = EXPENSES_COLUMN;
    const row = '31'; // TODO: получать динамически
    try {
      const values = await this.#googleSheetsService.getData(accountingSpreadsheetId, `${SHEET_NAME}!${column + row}`);
      const [expenses] = values.flat();
      return `Общая сумма затрат: ${expenses.trim()}`;
    } catch (error) {
      console.error(error);
      return 'Ошибка получении данных по общей сумме затрат.';
    }
  }

  async createIncomeMessage(): Promise<string> {
    const { accountingSpreadsheetId } = this.#options;
    const column = INCOME_COLUMN;
    const row = '31'; // TODO: получать динамически
    const range = `${SHEET_NAME}!${column + row}`;
    try {
      const values = await this.#googleSheetsService.getData(accountingSpreadsheetId, range);
      const [income] = values.flat();
      return `Общий доход: ${income.trim()}`;
    } catch (error) {
      console.error(error);
      return 'Ошибка при получении данных по общему доходу.';
    }
  }

  async createInvestmentMessage(text: string): Promise<string> {
    const { accountingSpreadsheetId } = this.#options;
    const name = text.split(' ').slice(1).join(' ');
    const column = columnsMap.get(name) ?? INVESTMENT_COLUMN;
    const row = '31'; // TODO: получать динамически
    const range = `${SHEET_NAME}!${column + row}`;
    try {
      const values = await this.#googleSheetsService.getData(accountingSpreadsheetId, range);
      const [investment] = values.flat();
      const textMessage = name ? `Сумма вложений "${name}":` : 'Общая сумма вложений';
      return `${textMessage} ${investment.trim()}`;
    } catch (error) {
      console.error(error);
      return 'Ошибка при получении данных по сумме вложений.';
    }
  }

  async createProfitMessage(): Promise<string> {
    const { accountingSpreadsheetId } = this.#options;
    const range = `${SHEET_NAME}!${PROFIT_CELL}`;
    try {
      const values = await this.#googleSheetsService.getData(accountingSpreadsheetId, range);
      const [profit] = values.flat();
      return `Прибыль: ${profit.trim()}`;
    } catch (error) {
      console.error(error);
      return 'Ошибка при получении данных по прибыли.';
    }
  }

  async createFundMessage(): Promise<string> {
    const { accountingSpreadsheetId } = this.#options;
    const range = `${SHEET_NAME}!${FUND_CELL}`;
    try {
      const values = await this.#googleSheetsService.getData(accountingSpreadsheetId, range);
      const [fund] = values.flat();
      return `Денег в банке (фонд): ${fund.trim()}`;
    } catch (error) {
      console.error(error);
      return 'Ошибка при получении данных по деньгам в банке.';
    }
  }
}

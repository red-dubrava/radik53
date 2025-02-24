import { GoogleSheetsService } from '@radik53/services';

export class TelegrafHelpers {
  private googleSheetsService: GoogleSheetsService;
  private accountingSpreadsheetId: string;
  private static SHEET_NAME = 'Лист1';
  private static INVESTMENT_COLUMN = 'G';
  private static EXPENSES_COLUMN = 'N';
  private static INCOME_COLUMN = 'Q';
  private static FUND_CELL = 'C3';
  private static PROFIT_CELL = 'C4';

  constructor(googleSheetsService: GoogleSheetsService, accountingSpreadsheetId: string) {
    this.googleSheetsService = googleSheetsService;
    this.accountingSpreadsheetId = accountingSpreadsheetId;
  }

  async createExpensesMessage(): Promise<string> {
    const column = TelegrafHelpers.EXPENSES_COLUMN;
    const row = '31';
    try {
      const values = await this.googleSheetsService.getData(this.accountingSpreadsheetId, `${TelegrafHelpers.SHEET_NAME}!${column + row}`);
      const [expenses] = values.flat();
      return `Общая сумма затрат: ${expenses.trim()}`;
    } catch (error) {
      console.error(error);
      return 'Ошибка при получении данных из таблицы.';
    }
  }

  async createIncomeMessage(): Promise<string> {
    const column = TelegrafHelpers.INCOME_COLUMN;
    const row = '31';
    try {
      const values = await this.googleSheetsService.getData(this.accountingSpreadsheetId, `${TelegrafHelpers.SHEET_NAME}!${column + row}`);
      const [income] = values.flat();
      return `Общий доход: ${income.trim()}`;
    } catch (error) {
      console.error(error);
      return 'Ошибка при получении данных из таблицы.';
    }
  }

  async createInvestmentMessage(text: string): Promise<string> {
    const name = text.split(' ').slice(1).join(' ');
    const column = name ? this.getInvestmentColumn(name) : TelegrafHelpers.INVESTMENT_COLUMN;
    const row = '31';
    try {
      const values = await this.googleSheetsService.getData(this.accountingSpreadsheetId, `${TelegrafHelpers.SHEET_NAME}!${column + row}`);
      const [investment] = values.flat();
      const textMessage = name ? `Сумма вложений "${name}":` : 'Общая сумма вложений';
      return `${textMessage} ${investment.trim()}`;
    } catch (error) {
      console.error(error);
      return 'Ошибка при получении данных из таблицы.';
    }
  }

  async createProfitMessage(): Promise<string> {
    try {
      const values = await this.googleSheetsService.getData(
        this.accountingSpreadsheetId,
        `${TelegrafHelpers.SHEET_NAME}!${TelegrafHelpers.PROFIT_CELL}`,
      );
      const [profit] = values.flat();
      return `Прибыль: ${profit.trim()}`;
    } catch (error) {
      console.error(error);
      return 'Ошибка при получении данных из таблицы.';
    }
  }

  async createFundMessage(): Promise<string> {
    try {
      const values = await this.googleSheetsService.getData(
        this.accountingSpreadsheetId,
        `${TelegrafHelpers.SHEET_NAME}!${TelegrafHelpers.FUND_CELL}`,
      );
      const [fund] = values.flat();
      return `Деньги в банке (фонд): ${fund.trim()}`;
    } catch (error) {
      console.error(error);
      return 'Ошибка при получении данных из таблицы.';
    }
  }

  private getInvestmentColumn(name: string): string {
    const columnsMap = new Map<string, string>([
      ['Саша', 'D'],
      ['Миша', 'E'],
      ['Сергей', 'F'],
    ]);
    return columnsMap.get(name) ?? TelegrafHelpers.INVESTMENT_COLUMN;
  }
}

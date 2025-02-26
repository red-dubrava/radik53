export interface TelegrafSheetsService {
  createExpensesMessage(): Promise<string>;
  createIncomeMessage(): Promise<string>;
  createInvestmentMessage(text: string): Promise<string>;
  createProfitMessage(): Promise<string>;
  createFundMessage(): Promise<string>;
}

import { Context, Markup } from 'telegraf';
import { GoogleSheetsService } from '@radik53/services';
import { capitalizeFirstLetter } from './utils';

/**
 * Обрабатывает команду /expenses (Общие затраты)
 */
export async function handleExpenses(ctx: Context, googleSheetsService: GoogleSheetsService, accountingSpreadsheetId: string) {
  const message = await createExpensesMessage(googleSheetsService, accountingSpreadsheetId);
  await ctx.reply(capitalizeFirstLetter(message)); // Отправляем пользователю сообщение с заглавной буквы
}

/**
 * Обрабатывает команду /income (Общий доход)
 */
export async function handleIncome(ctx: Context, googleSheetsService: GoogleSheetsService, accountingSpreadsheetId: string) {
  const message = await createIncomeMessage(googleSheetsService, accountingSpreadsheetId);
  await ctx.reply(capitalizeFirstLetter(message));
}

/**
 * Обрабатывает команду /investment (Общие вложения или вложение конкретного человека)
 */
export async function handleInvestment(ctx: Context, googleSheetsService: GoogleSheetsService, accountingSpreadsheetId: string, text: string) {
  const message = await createInvestmentMessage(googleSheetsService, accountingSpreadsheetId, text);
  await ctx.reply(capitalizeFirstLetter(message));
}

/**
 * Обрабатывает команду /profit (Прибыль)
 */
export async function handleProfit(ctx: Context, googleSheetsService: GoogleSheetsService, accountingSpreadsheetId: string) {
  const message = await createProfitMessage(googleSheetsService, accountingSpreadsheetId);
  await ctx.reply(capitalizeFirstLetter(message));
}

/**
 * Обрабатывает команду /fund (Фонд)
 */
export async function handleFund(ctx: Context, googleSheetsService: GoogleSheetsService, accountingSpreadsheetId: string) {
  const message = await createFundMessage(googleSheetsService, accountingSpreadsheetId);
  await ctx.reply(capitalizeFirstLetter(message));
}

/**
 * Обрабатывает команду /help (Выводит список доступных команд с кнопками)
 */
export async function handleHelp(ctx: Context) {
  await ctx.reply(
    'Доступные команды:',
    Markup.inlineKeyboard([
      [Markup.button.callback('Общий доход', 'income')],
      [Markup.button.callback('Общие затраты', 'expenses')],
      //  [Markup.button.callback('Общие вложения', 'investment')],
      // [Markup.button.callback('Вложение ""', 'investment')],
      //  [Markup.button.callback('Вложение "Миша"', 'investment Миша')],
      //  [Markup.button.callback('Вложение "Сергей"', 'investment Сергей')],
      [Markup.button.callback('Прибыль', 'profit')],
      [Markup.button.callback('Фонд', 'fund')],
    ]),
  );
}

// Функции для получения данных из Google Sheets

/**
 * Получает сумму всех затрат из Google Sheets
 */
export async function createExpensesMessage(googleSheetsService: GoogleSheetsService, accountingSpreadsheetId: string) {
  return await getDataFromSheet(googleSheetsService, accountingSpreadsheetId, 'N31', 'Общая сумма затрат');
}

/**
 * Получает общий доход из Google Sheets
 */
export async function createIncomeMessage(googleSheetsService: GoogleSheetsService, accountingSpreadsheetId: string) {
  return await getDataFromSheet(googleSheetsService, accountingSpreadsheetId, 'Q31', 'Общий доход');
}

/**
 * Получает сумму вложений. Если указано имя, то показывает вложения конкретного человека.
 */
export async function createInvestmentMessage(googleSheetsService: GoogleSheetsService, accountingSpreadsheetId: string, text: string) {
  const name = text.split(' ').slice(1).join(' '); // Извлекаем имя из команды
  const column = 'G'; // Столбец для инвестиций (по умолчанию)
  const row = '31'; // TODO: вычислить динамически
  const label = name ? `Сумма вложений "${name}"` : 'Общая сумма вложений';
  return await getDataFromSheet(googleSheetsService, accountingSpreadsheetId, `${column}${row}`, label);
}

/**
 * Получает прибыль из Google Sheets
 */
export async function createProfitMessage(googleSheetsService: GoogleSheetsService, accountingSpreadsheetId: string) {
  return await getDataFromSheet(googleSheetsService, accountingSpreadsheetId, 'C4', 'Прибыль');
}

/**
 * Получает сумму денег в банке (фонд) из Google Sheets
 */
export async function createFundMessage(googleSheetsService: GoogleSheetsService, accountingSpreadsheetId: string) {
  return await getDataFromSheet(googleSheetsService, accountingSpreadsheetId, 'C3', 'Денег в банке (фонд)');
}

/**
 * Универсальная функция для получения данных из Google Sheets
 * @param googleSheetsService - Сервис для работы с Google Sheets
 * @param accountingSpreadsheetId - ID Google-таблицы
 * @param cell - Ячейка, из которой нужно получить данные
 * @param label - Название для вывода в ответе
 * @returns Строка с данными или сообщение об ошибке
 */
async function getDataFromSheet(googleSheetsService: GoogleSheetsService, accountingSpreadsheetId: string, cell: string, label: string) {
  try {
    const values = await googleSheetsService.getData(accountingSpreadsheetId, `Лист1!${cell}`);
    const [data] = values.flat(); // Получаем первое значение из массива данных
    return `${label}: ${data.trim()}`; // Формируем и возвращаем отформатированное сообщение
  } catch (error) {
    console.error(error);
    return 'Ошибка при получении данных из таблицы.'; // Возвращаем сообщение об ошибке
  }
}

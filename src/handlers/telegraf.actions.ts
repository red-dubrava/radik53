import { Context } from 'telegraf';
import { GoogleSheetsService } from '@radik53/services';
import { capitalizeFirstLetter } from './utils';
import { createExpensesMessage, createIncomeMessage, createInvestmentMessage, createProfitMessage, createFundMessage } from './telegraf.commands';

export async function handleActionExpenses(ctx: Context, googleSheetsService: GoogleSheetsService, accountingSpreadsheetId: string) {
  if (!(await isChatMember(ctx))) return; // Проверяем, является ли бот участником чата

  const firstName = ctx.from?.first_name ?? 'Пользователь'; // Получаем имя пользователя
  const message = await createExpensesMessage(googleSheetsService, accountingSpreadsheetId);

  if (typeof message !== 'string') return; // Проверяем, что message - это строка
  await ctx.answerCbQuery(); // Закрываем всплывающее уведомление в Telegram
  await ctx.reply(`${firstName}, ${capitalizeFirstLetter(message)}`); // Отправляем ответ пользователю
}

/**
 * Обрабатывает нажатие кнопки "Общий доход".
 */
export async function handleActionIncome(ctx: Context, googleSheetsService: GoogleSheetsService, accountingSpreadsheetId: string) {
  if (!(await isChatMember(ctx))) return;

  const firstName = ctx.from?.first_name ?? 'Пользователь';
  const message = await createIncomeMessage(googleSheetsService, accountingSpreadsheetId);

  if (typeof message !== 'string') return;
  await ctx.answerCbQuery();
  await ctx.reply(`${firstName}, ${capitalizeFirstLetter(message)}`);
}

/**
 * Обрабатывает нажатие кнопки "Общие вложения" или конкретного вложения.
 */
export async function handleActionInvestment(ctx: Context, googleSheetsService: GoogleSheetsService, accountingSpreadsheetId: string) {
  if (!(await isChatMember(ctx))) return;

  // Проверяем, что callbackQuery существует и содержит data
  if (!ctx.callbackQuery || !('data' in ctx.callbackQuery) || typeof ctx.callbackQuery.data !== 'string') return;

  const firstName = ctx.from?.first_name ?? 'Пользователь';
  const message = await createInvestmentMessage(googleSheetsService, accountingSpreadsheetId, ctx.callbackQuery.data);

  await ctx.answerCbQuery();
  await ctx.reply(`${firstName}, ${capitalizeFirstLetter(message)}`);
}

/**
 * Обрабатывает нажатие кнопки "Прибыль".
 */
export async function handleActionProfit(ctx: Context, googleSheetsService: GoogleSheetsService, accountingSpreadsheetId: string) {
  if (!(await isChatMember(ctx))) return;

  const firstName = ctx.from?.first_name ?? 'Пользователь';
  const message = await createProfitMessage(googleSheetsService, accountingSpreadsheetId);

  if (typeof message !== 'string') return;
  await ctx.answerCbQuery();
  await ctx.reply(`${firstName}, ${capitalizeFirstLetter(message)}`);
}

/**
 * Обрабатывает нажатие кнопки "Фонд".
 */
export async function handleActionFund(ctx: Context, googleSheetsService: GoogleSheetsService, accountingSpreadsheetId: string) {
  if (!(await isChatMember(ctx))) return;

  const firstName = ctx.from?.first_name ?? 'Пользователь';
  const message = await createFundMessage(googleSheetsService, accountingSpreadsheetId);

  if (typeof message !== 'string') return;
  await ctx.answerCbQuery();
  await ctx.reply(`${firstName}, ${capitalizeFirstLetter(message)}`);
}

/**
 * Проверяет, является ли бот участником чата.
 */
async function isChatMember(ctx: Context): Promise<boolean> {
  const chatId = ctx.chat?.id;
  let botId = ctx.botInfo?.id; // Получаем ID бота из контекста

  if (!chatId) return false; // Если chatId отсутствует, значит, бот не в чате

  // Если botId не установлен, получаем его вручную
  if (!botId) {
    try {
      const botInfo = await ctx.telegram.getMe(); // Запрашиваем информацию о боте
      botId = botInfo.id;
    } catch {
      return false; // Если не удалось получить информацию о боте, выходим
    }
  }

  try {
    // Проверяем, состоит ли бот в чате
    const member = await ctx.telegram.getChatMember(chatId, botId);
    return ['member', 'administrator', 'creator'].includes(member.status); // Бот должен быть участником или администратором
  } catch {
    return false; // Если ошибка (например, бот не в чате), возвращаем false
  }
}

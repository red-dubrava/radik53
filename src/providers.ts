import { Provider } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Telegraf } from 'telegraf';
import { google } from 'googleapis';
import type { GoogleAuth } from 'googleapis-common';

import { AppConfig, AppOptions } from './types';
import {
  appOptionsProviderKey,
  miningPoolMessageServiceProviderKey,
  googleProviderKey,
  telegrafProviderKey,
  telegrafSheetsProviderKey,
} from './keys';
import { SheetsQueryService } from './services';
import { EmcdMessageService } from './services/emcd-message.service';

export type AppConfigService = ConfigService<AppConfig, true>;

export const appOptionsProvider: Provider = {
  provide: appOptionsProviderKey,
  useFactory: (configService: AppConfigService): AppOptions => {
    return {
      accountingSpreadsheetId: configService.get('ACCOUNTING_SPREADSHEET_ID'),
      emcdKey: configService.get('EMCD_KEY'),
      hashrateChangeThreshold: +configService.get('HASHRATE_CHANGE_THRESHOLD'),
      minerIp: configService.get('MINER_IP'),
    };
  },
  inject: [ConfigService],
} satisfies Provider;

export const telegrafProvider: Provider = {
  provide: telegrafProviderKey,
  useFactory: (configService: AppConfigService): Telegraf => {
    return new Telegraf(configService.get('TELEGRAM_BOT_TOKEN'));
  },
  inject: [ConfigService],
} satisfies Provider;

export const googleProvider: Provider = {
  provide: googleProviderKey,
  useFactory: (configService: AppConfigService): GoogleAuth => {
    return new google.auth.GoogleAuth({
      keyFile: configService.get('GOOGLE_CREDENTIALS_FILEPATH'),
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });
  },
  inject: [ConfigService],
} satisfies Provider;

export const sheetsQueryServiceProvider: Provider = {
  provide: telegrafSheetsProviderKey,
  useClass: SheetsQueryService,
} satisfies Provider;

export const miningPoolMessageServiceProvider: Provider = {
  provide: miningPoolMessageServiceProviderKey,
  useClass: EmcdMessageService,
} satisfies Provider;

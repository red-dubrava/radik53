import { Module } from '@nestjs/common';
import { StatsController } from './controllers';
import { EmcdService, GoogleSheetsService, HttpService, TelegramService, WorkerService } from './services';
import { ConfigModule } from '@nestjs/config';
import { validateConfig } from './helpers';
import { AppConfig } from './types';
import { appOptionsProvider, miningPoolMessageServiceProvider, googleProvider, sheetsQueryServiceProvider, telegrafProvider } from './providers';
import { TelegrafActionsHandler, TelegrafCommandsHandler, TelegrafEventsHandler } from './handlers';
import { MinerService } from './services/miner.service';

const processVars = [
  'TELEGRAM_BOT_TOKEN',
  'GOOGLE_CREDENTIALS_FILEPATH',
  'ACCOUNTING_SPREADSHEET_ID',
  'EMCD_KEY',
  'HASHRATE_CHANGE_THRESHOLD',
  'MINER_IP',
] satisfies (keyof AppConfig)[];

@Module({
  imports: [
    ConfigModule.forRoot({
      validate: (config): AppConfig => validateConfig(config, processVars),
    }),
  ],
  controllers: [StatsController],
  providers: [
    TelegramService,
    GoogleSheetsService,
    HttpService,
    MinerService,
    EmcdService,
    WorkerService,
    TelegrafEventsHandler,
    TelegrafCommandsHandler,
    TelegrafActionsHandler,
    appOptionsProvider,
    telegrafProvider,
    googleProvider,
    sheetsQueryServiceProvider,
    miningPoolMessageServiceProvider,
  ],
})
export class AppModule {}

export interface AppConfig {
  TELEGRAM_BOT_TOKEN: string;
  GOOGLE_CREDENTIALS_FILEPATH: string;
  ACCOUNTING_SPREADSHEET_ID: string;
  EMCD_KEY: string;
  HASHRATE_CHANGE_THRESHOLD: string;
}

export interface AppOptions {
  accountingSpreadsheetId: string;
  emcdKey: string;
  hashrateChangeThreshold: number;
}

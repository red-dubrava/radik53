import { Injectable, Inject } from '@nestjs/common';
import { google, sheets_v4 } from 'googleapis';
import type { GoogleAuth } from 'googleapis-common';
import { googleProviderKey } from '../keys';

@Injectable()
export class GoogleSheetsService {
  private sheets: sheets_v4.Sheets;

  constructor(@Inject(googleProviderKey) auth: GoogleAuth) {
    this.sheets = google.sheets({ version: 'v4', auth });
  }

  async getData(spreadsheetId: string, range: string): Promise<string[][]> {
    const response = await this.sheets.spreadsheets.values.get({
      spreadsheetId,
      range,
      valueRenderOption: 'FORMATTED_VALUE',
    });
    return response.data.values || [];
  }

  async appendData(spreadsheetId: string, range: string, values: any[][]): Promise<void> {
    await this.sheets.spreadsheets.values.append({
      spreadsheetId,
      range,
      valueInputOption: 'RAW',
      requestBody: { values },
    });
  }

  async updateData(spreadsheetId: string, range: string, values: any[][]): Promise<void> {
    await this.sheets.spreadsheets.values.update({
      spreadsheetId,
      range,
      valueInputOption: 'RAW',
      requestBody: { values },
    });
  }
}

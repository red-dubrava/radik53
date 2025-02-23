import { Body, Controller, HttpCode, Post } from '@nestjs/common';
import { Stats, TelegramService } from '@radik53/services';

@Controller('api')
export class StatsController {
  readonly #telegramService: TelegramService;

  constructor(telegramService: TelegramService) {
    this.#telegramService = telegramService;
  }

  @Post('stats')
  @HttpCode(200)
  async receiveStats(@Body() stats: Stats): Promise<{ status: string }> {
    await this.#telegramService.saveStats(stats);
    return { status: 'ok' };
  }
}

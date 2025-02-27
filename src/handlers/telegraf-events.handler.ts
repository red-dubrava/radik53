import { Inject, Injectable } from '@nestjs/common';
import { telegrafProviderKey } from '../keys';
import { Telegraf } from 'telegraf';
import { message } from 'telegraf/filters';

@Injectable()
export class TelegrafEventsHandler {
  readonly #telegraf: Telegraf;

  constructor(@Inject(telegrafProviderKey) telegraf: Telegraf) {
    this.#telegraf = telegraf;
  }

  onModuleInit(): void {
    this.#telegraf.on(message('new_chat_members'), (ctx) => {
      const { botInfo, message, chat } = ctx;
      const botId = botInfo?.id;
      if (message.new_chat_members.some((member) => member.id === botId)) {
        console.log(`Бот добавлен в чат: ${chat.id}`);
      }
    });

    this.#telegraf.on(message('left_chat_member'), (ctx) => {
      const { botInfo, message, chat } = ctx;
      if (message.left_chat_member.id === botInfo?.id) {
        console.log(`Бот удалён из чата: ${chat.id}`);
      }
    });
  }
}

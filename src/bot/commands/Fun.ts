import { DiscordEvent } from '../api/command';
import * as Discord from 'discord.js';
import { Client } from '../api/client';
import { HelpField } from '../..';
import { AbstractCommand } from './AbstractCommand';
import { DiscordEvents } from '../core/DiscordEvents';

export class Fun extends AbstractCommand {

  prototype?: object | undefined;

  public command = 'primary command name';
  public aliases: string[] = ['some alias'];
  public requiresGuild = true;
  public applyHelp = false;

  protected listeners: DiscordEvent[] = [];

  constructor(client: Client) {
    super(client);
    this.listeners.push(DiscordEvents.MESSAGE);
  }

  async onMessage(message: Discord.Message): Promise<void> {
    if (message.author.bot) return;
    if (message.cleanContent.toLocaleLowerCase().indexOf('o7') >= 0) {
      if (this.getRandomNumber(100) < 20) {
        message.reply('o7');
      }
    }
  }

  private getRandomNumber(max: number): number {
    return Math.floor(Math.random() * Math.floor(max));
  }

  help(): HelpField[] {
    return [{ name: this.client.bot.config.prefix + this.command, value: 'Unspecified help' }];
  }
}

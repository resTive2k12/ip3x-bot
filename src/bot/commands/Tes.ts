import * as Discord from 'discord.js';
import { Client } from '../api/client';
import { HelpField } from '../..';
import { AbstractCommand } from './AbstractCommand';
import { DiscordEvents } from '../core/DiscordEvents';

export class Tests extends AbstractCommand {
  prototype?: object | undefined;

  public command = 'primary command name';
  public aliases: string[] = ['some alias'];
  public requiresBotMention = false;
  public applyHelp = false;

  constructor(client: Client) {
    super(client);
    this.listeners.push(DiscordEvents.MESSAGE);
  }

  /**
   * Gets called to every message command!
   * @param {Client} client the issueing Client
   * @param {Discord.Message} message the message
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onMessage(message: Discord.Message): void {
    //nothing to do here
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  run(message: Discord.Message, args?: string[] | undefined): void {
    //nothing to do here
  }

  help(): HelpField[] {
    return [{ name: this.client.bot.config.prefix + this.command, value: 'Unspecified help' }];
  }
}

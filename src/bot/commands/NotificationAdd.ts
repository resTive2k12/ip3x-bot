import { Client } from '../api/client';
import * as Discord from 'discord.js';
import { HelpField } from '../..';
import { AbstractCommand } from './AbstractCommand';
import { DiscordEvents } from '../core/DiscordEvents';
import { NotificationChannels } from '../api/storage';

export class NotificationAdd extends AbstractCommand {
  public command = 'add-notify';
  public aliases: string[] = [];
  public requiresBotMention = true;
  public requiresAdminAccess = true;
  public botAllowed = false;

  constructor(client: Client) {
    super(client);
    this.listeners.push(DiscordEvents.MESSAGE);
  }

  async onMessage(message: Discord.Message): Promise<void> {
    const matches = await this.matches(message);
    if (!matches) {
      return;
    }

    let parsed = this.parseMessageIntoParameters(message);
    parsed = parsed.slice(2);
    const entry = await this.db.fetch(message.guild.id);
    const channels: NotificationChannels[] = entry.notificationChannels || [];
    parsed.forEach(async item => {
      const mentions = item.match(/^<(((?:#))(\d+))>$/);
      if (mentions) {
        if (channels.find(channel => channel.id === mentions[3])) {
          console.debug(`${this.constructor.name}#onMessage entry for id ${mentions[3]} already exists.`);
          return;
        }
        if (mentions[2] === '#') {
          channels.push({ id: mentions[3] });
        } else {
          console.debug(`${this.constructor.name}#onMessage ignoring mention ${mentions[0]}. It is not a channel.`);
        }
      }
    });
    entry.notificationChannels = channels;
    this.db
      .update(entry)
      .then(() => message.channel.send('Successfully added.'))
      .catch(rejected => {
        message.channel.send('Failed to add access. Check protocol.');
        console.error('Error saving adding admin access: ', rejected);
      });
  }

  help(): HelpField[] {
    return [
      {
        name: 'add-notify',
        value: 'The mentions of channels which are added to the notification.\n\n**Usage**: ```@IP3X-Assistant add-notify #channel [...#channel]```'
      }
    ];
  }
}

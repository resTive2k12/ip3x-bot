import { Client } from '../api/client';
import * as Discord from 'discord.js';
import { HelpField } from '../..';
import { AbstractCommand } from './AbstractCommand';
import { DiscordEvents } from '../core/DiscordEvents';
import { NotificationChannels } from '../api/storage';

export class NotificationRemove extends AbstractCommand {
  public command = 'remove-notify';
  public aliases: string[] = [];
  public requiresBotMention = true;
  public requiresAdminAccess = true;
  public botAllowed = false;

  constructor(client: Client) {
    super(client);
    this.listeners.push(DiscordEvents.MESSAGE);
  }

  async onMessage(message: Discord.Message): Promise<void> {
    //console.trace(this.constructor.name, 'called.', message.channel.id, message.channel.type, new Date());

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
        if (!channels.find(channel => channel.id === mentions[3])) {
          console.debug(`${this.constructor.name}#onMessage entry for id ${mentions[3]} does not exists.`);
          return;
        }
        const itemIdx = channels.findIndex(channel => channel.id === mentions[3]);
        if (itemIdx >= 0) {
          channels.splice(itemIdx, 1);
        }
      }
    });
    entry.notificationChannels = channels;
    this.db
      .update(entry)
      .then(() => {
        message.channel.send('Successfully removed.').catch(console.log);
      })
      .catch(rejected => {
        message.channel.send('Failed to remove access. Check protocol.').catch(console.log);
        console.error('Error saving removed admin access: ', rejected);
      });
  }

  help(): HelpField[] {
    return [
      {
        name: 'remove-notify',
        value: 'The mentions of channels which are removed from the notification.\n\n**Usage**: ```@IP3X-Assistant remove-notify #channel [...#channel]```'
      }
    ];
  }
}

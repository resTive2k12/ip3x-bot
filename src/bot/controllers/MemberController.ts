import { Client } from '../api/client';
import { AbstractController } from './AbstractController';
import { DiscordEvents } from '../core/DiscordEvents';
import * as Discord from 'discord.js';

export class MemberController extends AbstractController {
  constructor(client: Client) {
    super(client);
    this.listeners.push(DiscordEvents.PRESENCE_UPDATE);
  }

  onPresenceUpdate(oldUser: Discord.GuildMember, newUser: Discord.GuildMember): void {
    const oldStatus = oldUser.presence.status;
    const newStatus = newUser.presence.status;
    console.debug(`${newUser.nickname || newUser.user.username} changed from ${oldStatus} to ${newStatus}.`);
  }
}

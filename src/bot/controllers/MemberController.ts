import { Client } from '../api/client';
import { AbstractController } from './AbstractController';
import { DiscordEvents } from '../core/DiscordEvents';
import * as Discord from "discord.js";
import { stringify } from 'querystring';
import { User } from '../api/storage';

export class MemberController extends AbstractController {
  constructor(client: Client) {
    super(client);
    this.listeners.push(DiscordEvents.READY);
    this.listeners.push(DiscordEvents.GUILD_MEMBER_ADD);
    this.listeners.push(DiscordEvents.GUILD_MEMBER_REMOVE);
    this.listeners.push(DiscordEvents.PRESENCE_UPDATE);
  }

  onReady(): void {
    this.client.guilds.forEach(async guild => {
      const entry = await this.client.db.fetch(guild.id);
      if (!entry) return;
      if (!entry.users) entry.users = [];
      const users = new Map(entry.users.map(e => [e.id, e]));
      console.debug(`Checking guild ${guild.name} [${guild.id}]...`);
      guild.members.forEach(member => {
        const userIsKnown = users.size > 0 && !!users.get(member.id);
        if (!userIsKnown) {
          users.set(member.user.id, { id: member.user.id, name: member.user.username, joinedAt: member.joinedAt, isBot: member.user.bot });
          console.debug(`\t- Added new user ${member.nickname || member.user.username} ID: ${member.user.id}.`);
        } else {
          console.debug(`\t- User ${member.nickname || member.user.username} [${member.user.id}] is present.`);
        }
      });
      entry.users = Array.from(users.values());
      console.log(entry.users);
      this.client.db.update(entry);
    });
  }

  onPresenceUpdate(oldUser: Discord.GuildMember, newUser: Discord.GuildMember): void {
    const oldStatus = oldUser.presence.status;
    const newStatus = newUser.presence.status;

    if (newStatus == "offline") {
      this.client.db.fetch(newUser.guild.id).then(entry => {
        if (!entry.users) {
          console.trace("Users should be present here...");
          return;
        }
        const user = entry.users.get(newUser.id);
        if (!user) {
          console.trace(`User "${newUser.nickname || newUser.user.username}" [${newUser.id}] should be present here...`);
          return;
        }
        user.lastSeen = new Date();
        entry.users.set(newUser.id, user);
        this.client.db.update(entry);
      });
    }

    console.log(`${newUser.nickname || newUser.user.username} switch from ${oldStatus} to ${newStatus}`);
  }
}

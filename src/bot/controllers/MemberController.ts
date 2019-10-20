import { Client } from '../api/client';
import { AbstractController } from './AbstractController';
import { DiscordEvents } from '../core/DiscordEvents';
import * as Discord from 'discord.js';
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
      const users = MemberController.usersToMap(entry.users);
      console.debug(`Checking guild ${guild.name} [${guild.id}]...`);
      guild.members.forEach(member => {
        const userIsKnown = users.size > 0 && !!users.get(member.id);
        if (!userIsKnown) {
          users.set(member.user.id, { id: member.user.id, name: member.user.username, joinedAt: member.joinedAt, isBot: member.user.bot });
          console.debug(`\t- Added new user ${member.nickname || member.user.username} ID: ${member.user.id}.`);
        } else {
          const user = users.get(member.id);
          if (user && user.application) {
            if (!user.application.finishedAt) {
              console.debug(
                `\t- User ${member.nickname || member.user.username} [${member.user.id}] is present and has a pending application (Step ${
                  user.application.applicationStep
                }).`
              );
              if (!this.client.users.get(user.id)!.dmChannel) {
                this.client.users
                  .get(user.id)!
                  .createDM()
                  .then(ch => {
                    ch.fetchMessages();
                  });
              } else {
                this.client.users.get(user.id)!.dmChannel.fetchMessages();
              }
              //(this.client.channels.get(user.application.dmChannelId) as Discord.DMChannel).fetchMessages();
            } else {
              console.debug(`\t- User ${member.nickname || member.user.username} [${member.user.id}] is present and has a finished application.`);
            }
          } else {
            console.debug(`\t- User ${member.nickname || member.user.username} [${member.user.id}] is present.`);
          }
        }
      });
      entry.users = MemberController.usersToArray(users);
      this.client.db.update(entry);
    });
  }

  onPresenceUpdate(oldUser: Discord.GuildMember, newUser: Discord.GuildMember): void {
    const oldStatus = oldUser.presence.status;
    const newStatus = newUser.presence.status;

    if (newStatus != oldStatus) {
      this.client.db.fetch(newUser.guild.id).then(entry => {
        if (!entry.users) {
          console.trace('Users should be present here...');
          return;
        }
        const users = MemberController.usersToMap(entry.users);
        const user = users.get(newUser.id);
        if (!user) {
          console.trace(`User "${newUser.nickname || newUser.user.username}" [${newUser.id}] should be present here...`);
          return;
        }
        user.lastSeen = new Date();
        users.set(newUser.id, user);
        console.debug(`Updated users ${newUser.nickname || newUser.user.username} [${newUser.user.id}] presence from ${oldStatus} to ${newStatus}.`);
        entry.users = MemberController.usersToArray(users);
        this.client.db.update(entry);
      });
    }
  }

  onGuildMemberAdd(newMember: Discord.GuildMember): void {
    this.client.db.fetch(newMember.guild.id).then(entry => {
      if (!entry) return;
      if (!entry.users) entry.users = [];
      const users = MemberController.usersToMap(entry.users);
      users.set(newMember.user.id, { id: newMember.user.id, name: newMember.user.username, joinedAt: newMember.joinedAt, isBot: newMember.user.bot });
      console.debug(`Added new user ${newMember.nickname || newMember.user.username} [${newMember.user.id}].`);
      entry.users = MemberController.usersToArray(users);
      this.client.db.update(entry).then(() => {
        if (newMember.guild.systemChannel instanceof Discord.TextChannel) {
          const channel = newMember.guild.systemChannel as Discord.TextChannel;
          channel.send(MemberController.MSG_WELCOME(newMember));
          if (entry.notificationChannels) {
            entry.notificationChannels.forEach(ch => {
              const notify = this.client.channels.get(ch.id) as Discord.TextChannel;
              if (notify) {
                notify.send(`@here: ${newMember} just joined the server.`);
              }
            });
          }
        }
      });
    });
  }

  onGuildMemberRemove(member: Discord.GuildMember): void {
    this.client.db.fetch(member.guild.id).then(entry => {
      if (!entry) return;
      if (!entry.users) entry.users = [];
      const users = MemberController.usersToMap(entry.users);
      const user = users.get(member.user.id);
      if (user) {
        user.leftAt = new Date();
        user.lastSeen = user.leftAt;
        users.set(user.id, user);
        entry.users = MemberController.usersToArray(users);
        this.client.db.update(entry).then(entry => {
          if (entry.notificationChannels) {
            entry.notificationChannels.forEach(ch => {
              const notify = this.client.channels.get(ch.id) as Discord.TextChannel;
              if (notify) {
                notify.send(`@here: The user ${member} left the server. He had the roles: ${member.roles.map(role => role.name.slice(1)).join(', ')}`);
              }
            });
          }
          console.debug(`User ${member.nickname || member.user.username} [${member.user.id}] has left the server.`);
        });
      }
    });
  }

  public static usersToMap(users: User[]): Map<string, User> {
    return new Map(users.map(e => [e.id, e]));
  }

  public static usersToArray(users: Map<string, User>): User[] {
    return Array.from(users.values());
  }

  public static MSG_WELCOME = (member: Discord.GuildMember): string => `Welcome to **IP3X Headquarters**, ${member}!

If you’re looking to join our squadron, please type !join in this channel.

Meanwhile, we direct you to the #welcome channel, which contains important information.

_We hope you enjoy your stay_.`;
}

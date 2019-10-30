import { Client } from '../api/client';
import { AbstractController } from './AbstractController';
import { DiscordEvents } from '../core/DiscordEvents';
import * as Discord from 'discord.js';
import { User } from '../api/storage';
import { GoogleSheets } from '../../utilities/GoogleSheets';
import { Join } from '../commands/Join';

export class MemberController extends AbstractController {
  constructor(client: Client) {
    super(client);
    this.listeners.push(DiscordEvents.PRESENCE_UPDATE);
    this.listeners.push(DiscordEvents.GUILD_MEMBER_ADD);
    this.listeners.push(DiscordEvents.GUILD_MEMBER_REMOVE);
  }

  onPresenceUpdate(oldUser: Discord.GuildMember, newUser: Discord.GuildMember): void {
    const oldStatus = oldUser.presence.status;
    const newStatus = newUser.presence.status;
    console.debug(`${newUser.nickname || newUser.user.username} changed from ${oldStatus} to ${newStatus}.`);
  }

  async onGuildMemberAdd(member: Discord.GuildMember): Promise<void> {
    const user: User = {
      _id: member.id,
      guildId: member.guild.id,
      name: member.nickname || member.user.username,
      joinedAt: member.joinedAt,
      isBot: member.user.bot,
      inSquadron: 'Not applied',
      onInara: 'Not applied',
      inaraName: member.nickname || member.user.username,
      notified: 'Ignore',
      applicationStep: 'Ignore',
      comment: 'Just joined discord'
    };
    this.client.bot.userService.updateOrInsert(user).then(user => GoogleSheets.updateUser(this.client.bot.config, this.client.bot.config.sheets.members, user));
    if (member.guild.systemChannel instanceof Discord.TextChannel) {
      const channel = member.guild.systemChannel as Discord.TextChannel;
      channel.send(Join.MSG_WELCOME(member)).catch(console.log);
      this.client.db.fetch(member.guild.id).then(entry => {
        if (entry.notificationChannels && entry.notificationChannels.length > 0) {
          entry.notificationChannels.forEach(nc => {
            const channel = this.client.channels.get(nc.id);
            if (channel) {
              (channel as Discord.TextChannel).send(`@here: the user ${member.nickname || member.user.username} has joined discord.`);
            }
          });
        }
      });
    }
  }

  async onGuildMemberRemove(member: Discord.GuildMember): Promise<void> {
    this.client.bot.userService.fetch(member.id).then(user => {
      user.leftAt = new Date();
      user.comment = '!!!Has left discord!!! ' + user.comment;
      console.log('left:', user);
      GoogleSheets.updateUser(this.client.bot.config, this.client.bot.config.sheets.members, user);
      this.client.db.fetch(member.guild.id).then(entry => {
        if (entry.notificationChannels && entry.notificationChannels.length > 0) {
          entry.notificationChannels.forEach(nc => {
            const channel = this.client.channels.get(nc.id);
            if (channel) {
              (channel as Discord.TextChannel).send(`@here: the user ${member.nickname || member.user.username} has left discord.`);
            }
          });
        }
      });
    }).catch(reason => console.log('User load error', reason));
  }

}

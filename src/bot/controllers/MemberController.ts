import { Client } from '../api/client';
import { AbstractController } from './AbstractController';
import { DiscordEvents } from '../core/DiscordEvents';
import * as Discord from 'discord.js';

export class MemberController extends AbstractController {
  constructor(client: Client) {
    super(client);
    this.listeners.push(DiscordEvents.READY);
    this.listeners.push(DiscordEvents.GUILD_MEMBER_ADD);
    this.listeners.push(DiscordEvents.GUILD_MEMBER_REMOVE);
    this.listeners.push(DiscordEvents.PRESENCE_UPDATE);
  }

  onReady(): void {
    /*this.client.guilds.forEach(async guild => {
      const entry = await this.client.db.fetch(guild.id);
      if (!entry) return;
      if (!entry.users) entry.users = [];
      const users = DB.usersToMap(entry.users);
      console.debug(`Checking guild ${guild.name} [${guild.id}]...`);
      guild.members.forEach(member => {
        const userIsKnown = users.size > 0 && !!users.get(member.id);
        if (!userIsKnown) {
          const newUser: User = {
            _id: member.user.id,
            guildId: guild.id,
            name: member.nickname || member.user.username,
            joinedAt: member.joinedAt,
            isBot: member.user.bot,
            onInara: member.user.bot ? 'Bot' : 'Not checked',
            inSquadron: member.user.bot ? 'Bot' : 'Not checked',
            inaraName: member.nickname || member.user.username,
            notified: member.user.bot ? 'Bot' : 'Ignore',
            comment: member.user.bot
              ? 'This user is identified as a bot. No interaction required nor advisable.'
              : 'First startup. Entry needs to be manually completed.'
          };
          if (!member.user.bot) {
            newUser.application = {
              startAt: new Date(0),
              finishedAt: new Date(0),
              step: 'Ignore',
              msgId: undefined,
              dmChannelId: undefined
            };
          }
          users.set(member.user.id, newUser);
          console.debug(`\t- Added new user ${member.nickname || member.user.username} ID: ${member.user.id}.`);
        } else {
          const user = users.get(member.id);
          if (user && user.application) {
            if (!user.application.finishedAt) {
              console.debug(
                `\t- User ${member.nickname || member.user.username} [${member.user.id}] is present and has a pending application (Step ${
                  user.application.step
                }).`
              );
              const discordUser = this.client.users.get(user._id);
              if (discordUser && !discordUser.bot) {
                if (!discordUser.dmChannel) {
                  discordUser.createDM().then(ch => {
                    ch.fetchMessages();
                  });
                } else {
                  discordUser.dmChannel.fetchMessages();
                }
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
      entry.users = DB.usersToArray(users);

      this.client.db.update(entry);
    });*/
  }

  onPresenceUpdate(oldUser: Discord.GuildMember, newUser: Discord.GuildMember): void {
    const oldStatus = oldUser.presence.status;
    const newStatus = newUser.presence.status;
    /*

    if (newStatus != oldStatus) {
      this.client.db.fetch(newUser.guild.id).then(entry => {
        if (!entry.users) {
          console.trace('Users should be present here...');
          return;
        }
        const users = DB.usersToMap(entry.users);
        const user = users.get(newUser.id);
        if (!user) {
          //might happen if a new user joined
          return;
        }
        user.lastSeen = new Date();
        users.set(newUser.id, user);
        console.debug(`Updated users ${newUser.nickname || newUser.user.username} [${newUser.user.id}] presence from ${oldStatus} to ${newStatus}.`);
        entry.users = DB.usersToArray(users);

        this.client.db.update(entry);
      });
    }*/
  }

  onGuildMemberAdd(newMember: Discord.GuildMember): void {
    /*const newUser: User = {
      _id: newMember.user.id,
      guildId: newMember.guild.id,
      name: newMember.nickname || newMember.user.username,
      joinedAt: newMember.joinedAt,
      isBot: newMember.user.bot,
      onInara: 'No',
      inSquadron: 'No',
      inaraName: '<No name specified>',
      notified: 'No'
    };
    console.debug(`Added new user ${newMember.nickname || newMember.user.username} [${newMember.user.id}].`);
    this.client.db.updateUser(newMember.guild.id, newUser).then(user => {
      GoogleSheets.updateUser(this.client.bot.config, this.client.bot.config.sheets.members, user);
      this.client.db.fetch(newMember.guild.id).then(entry => {
        if (newMember.guild.systemChannel instanceof Discord.TextChannel) {
          const channel = newMember.guild.systemChannel as Discord.TextChannel;
          channel.send(MemberController.MSG_WELCOME(newMember)).catch(console.log);
          if (entry.notificationChannels) {
            entry.notificationChannels.forEach(ch => {
              const notify = this.client.channels.get(ch.id) as Discord.TextChannel;
              if (notify) {
                notify.send(`@here: ${newMember} just joined the server.`).catch(console.log);
              }
            });
          }
        }
      });
    });*/
  }

  onGuildMemberRemove(member: Discord.GuildMember): void {
    /*this.client.db
      .fetchUser(member.guild.id, member.id)
      .then(user => {
        user.leftAt = new Date();
        user.lastSeen = user.leftAt;
        return user;
      })
      .then(user => this.client.db.updateUser(member.guild.id, user))
      .then(user => GoogleSheets.updateUser(this.client.bot.config, this.client.bot.config.sheets.members, user))
      .then(user => {
        this.client.db
          .fetch(member.guild.id)
          .then(entry => {
            if (entry.notificationChannels) {
              entry.notificationChannels.forEach(ch => {
                const notify = this.client.channels.get(ch.id) as Discord.TextChannel;
                if (notify) {
                  notify
                    .send(`@here: The user ${user.name} left the server. He had the roles: ${member.roles.map(role => role.name.slice(1)).join(', ')}`)
                    .catch(console.log);
                }
              });
            }
            console.debug(`User ${member.nickname || member.user.username} [${member.user.id}] has left the server.`);
          })
          .catch(console.log);
      });*/
  }

  public static MSG_WELCOME = (member: Discord.GuildMember): string => `Welcome to **IP3X Headquarters**, ${member}!

If you’re looking to join our squadron, please type !join in this channel.

Meanwhile, we direct you to the #welcome channel, which contains important information.

_We hope you enjoy your stay_.`;
}

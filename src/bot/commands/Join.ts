import { Client } from '../api/client';
import * as Discord from 'discord.js';
import { AbstractCommand } from './AbstractCommand';
import { HelpField } from '../..';
import { DiscordEvents } from '../core/DiscordEvents';
import { User } from '../api/storage';
import { GoogleSheets } from '../../utilities/GoogleSheets';

export class Join extends AbstractCommand {
  public command = 'join';
  public aliases: string[] = ['apply'];
  public requiresPrefix = true;
  public requiresGuild = true;

  constructor(client: Client) {
    super(client);
    this.listeners.push(DiscordEvents.MESSAGE);
    this.listeners.push(DiscordEvents.REACTION_ADD);
    this.listeners.push(DiscordEvents.REACTION_REMOVE);
  }

  async onMessage(joinMessage: Discord.Message): Promise<void> {
    if (!(await this.matches(joinMessage))) {
      return;
    }

    const member = joinMessage.member;
    if (member.roles.size > 1) {
      member.roles.forEach(role => console.log(member.user.username, role.name));
      joinMessage.reply(Join.MSG_APPLICATION_NOT_ALLOWED);
      return;
    }

    joinMessage.member.send(Join.MSG_RESPONSE_1(member)).then(messages => {
      const msg = messages as Discord.Message;
      msg.react('✅').then(() => msg.react('❌'));
      joinMessage.channel
        .send(`${member}, i have sent you a direct message!`)
        .then(msg => {
          const message = msg as Discord.Message;
          return message.channel.id;
        })
        .then(channelId => {
          this.client.bot.userService
            .fetch(member.id)
            .then(user => {
              user.onInara = 'Not checked';
              user.inSquadron = 'Not checked';
              user.inaraName = '';
              user.notified = 'No';
              user.comment = 'Applied via !join command.';
              user.applicationStep = 'Started';
              user.application = {
                startAt: new Date(),

                dmChannelId: channelId,
                finishedAt: undefined
              };
              return user;
            })
            .then(user => this.client.bot.userService.updateOrInsert(user))
            .then(user => GoogleSheets.updateUser(this.client.bot.config, this.client.bot.config.sheets.members, user))
            .catch(console.log);
        })
        .catch(console.log);
    });
  }

  onReactionAdd(reaction: Discord.MessageReaction, user: Discord.User): void {
    if (user.bot || user.id === this.client.user.id) {
      return;
    }

    if (!reaction.me) {
      // if it is not a reaction the bot "initiated" i dont care at all
      return;
    }

    const emoji = reaction.emoji.name;

    if (emoji === '✅') {
      this.client.bot.userService.fetch(user.id).then(user => {
        const discordUser = this.client.users.get(user._id);
        if (!discordUser) return;
        if (!user.application) return;
        switch (user.applicationStep) {
          case 'Started':
            reaction.message.delete().then(() =>
              discordUser
                .send(Join.MSG_RESPONSE_2)
                .then(() => discordUser.send({ embed: { description: Join.MSG_RESPONSE_3 } }))
                .then(messages => {
                  const msg = messages as Discord.Message;
                  msg.react('✅').then(() => msg.react('❌'));
                  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                  user.applicationStep = 'In Progress';
                  return user;
                })
                .then(user => {
                  return this.client.bot.userService.updateOrInsert(user);
                })
                .then(user => {
                  return GoogleSheets.updateUser(this.client.bot.config, this.client.bot.config.sheets.members, user);
                })
                .catch(console.log)
            );
            break;
          case 'In Progress':
            reaction.message.delete().then(() =>
              discordUser
                .send(Join.MSG_RESPONSE_4(discordUser))
                .then(() => {
                  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                  user.applicationStep = 'Applied';
                  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                  user.application!.finishedAt = new Date();
                  return user;
                })
                .then(user => {
                  this.client.db.fetch(this.client.bot.config.sheets.members.guildId).then(entry => {
                    if (entry.notificationChannels && entry.notificationChannels.length > 0) {
                      entry.notificationChannels.forEach(nc => {
                        const channel = this.client.channels.get(nc.id);
                        if (channel) {
                          (channel as Discord.TextChannel).send(`@here: the user ${discordUser.username} as just finished his application.`);
                        }
                      });
                    }
                  });
                  return user;
                })
                .then(user => {
                  return this.client.bot.userService.updateOrInsert(user);
                })
                .then(user => {
                  return GoogleSheets.updateUser(this.client.bot.config, this.client.bot.config.sheets.members, user);
                })
                .catch(console.log)
            );
            break;
        }
      });
    } else if (emoji === '❌') {
      user.send(Join.MSG_CANCEL_APPLICATION).catch(console.log);
      this.client.bot.userService
        .fetch(user.id)
        .then(user => {
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          user.application!.finishedAt = new Date();
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          user.applicationStep = 'Cancelled';
          user.onInara = 'Not applied';
          user.inSquadron = 'Not applied';
          user.notified = 'Ignore';
          user.comment = 'User has cancelled application process via bot.';
          return user;
        })
        .then(user => {
          return this.client.bot.userService.updateOrInsert(user);
        })
        .then(user => {
          return GoogleSheets.updateUser(this.client.bot.config, this.client.bot.config.sheets.members, user);
        })
        .catch(console.log);
    }
  }

  onReactionRemove(reaction: Discord.MessageReaction, user: Discord.User): void {
    if (user.bot || user.id === this.client.user.id) {
      return;
    }

    if (!reaction.me) {
      // if it is not a reaction the bot "initiated" i dont care at all
      return;
    }
    console.debug(`Removed emoji ${reaction.emoji}, ${reaction.me}, ${user}`);
  }

  help(): HelpField[] {
    return [{ name: '!join', value: 'Starts the application process for potential new members.', inline: false }];
  }

  public static MSG_RESPONSE_1 = (member: Discord.GuildMember): string => `**o7 CMDR ${member}**

The IP3X application process takes a few minutes to complete and will assist you in joining IP3X both in-game and on Inara.
The application process is semi-automated via this bot - and completed once someone from IP3X Leadership verifies the submission, usually within 24 hours.

Once started, this process needs to be completed within :clock1: 1 hour, or it will cancel automatically.
You can start the process again at any point by typing !join in #general

To proceed, please make sure you are ready for the following:
=> Access to Elite (in-game) to apply in-game.
=> You have an account on Inara https://inara.cz and are able to login.

If you’re ready to proceed, please click :white_check_mark:
If you wish to cancel the process, please click :x:`;

  public static MSG_RESPONSE_2 = `You’ve chosen to proceed with your application. Please read the following instructions carefully as they greatly help us to process your application.

If for any reason you get stuck or have problems with this process, please reach out to someone in IP3X Leadership, easily identified on Discord.`;

  public static MSG_RESPONSE_3 = `:warning: Please complete the following steps BEFORE clicking proceed. :warning:

:no_entry: Please note you need to be at least 18+ to proceed.

:one: **DISCORD**
Please change your Discord nickname on this server to match your _in-game_ name.
If you need help with this step, please see [this official Discord page](https://support.discordapp.com/hc/en-us/articles/219070107-Server-Nicknames 'how to change your Discord name').

:two: **INARA**
Please visit https://inara.cz/squadron/6172/ and click the button to apply to join the squadron.

:three: **SQUADRON**
Please launch _Elite: Dangerous_ and _in-game_ go to your right-side panel. In the __home__ tab, find __squadrons__ and there search for **IP3X**. Please apply to join the squadron.

Once you’ve completed **all steps** above, please click :white_check_mark:
If you wish to cancel the process, please click :x:`;

  public static MSG_RESPONSE_4 = (member: Discord.GuildMember | Discord.User): string => `Thank you for completing your application, **CMDR ${member}**!

Your application has been received and will now be processed by **IP3X Leadership**.
If you don’t receive confirmation within :clock12: 48 hours, please do let us know.
We normally process within a few hours - but this may depend on your time-zone.

Meanwhile, please consider the following:
:one: Moving to **Turir, Brooks Terminal** as our HQ is located there.
:two: Set your Time-zone on _Inara_: https://inara.cz/settings/
:three: If you have privacy settings enabled on _Inara_, please consider changing anything set at _No_ to _Squadron Only_. `;

  public static MSG_CANCEL_APPLICATION = `Application process cancelled.

Please note you can restart the process at any time by typing !join in #public_chat`;

  public static MSG_WELCOME = (member: Discord.GuildMember): string => `Welcome to **IP3X Headquarters**, ${member}!

If you’re looking to join our squadron, please type !join in this channel.

Meanwhile, we direct you to the #welcome channel, which contains important information.

_We hope you enjoy your stay_.`;

  public static MSG_APPLICATION_NOT_ALLOWED = `unfortunately, your current roles do not allow an application. Please contact an admiral or officer!`;
}

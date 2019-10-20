import { Client } from '../api/client';
import * as Discord from 'discord.js';
import { AbstractCommand } from './AbstractCommand';
import { HelpField } from '../..';
import { DiscordEvents } from '../core/DiscordEvents';
import * as nedb from 'nedb';
import { MemberController } from '../controllers/MemberController';
import { User, GuildEntry } from '../api/storage';
import { GoogleSheets } from '../../utilities/GoogleSheets';
import { DB } from '../../utilities/Datastore';

export class Join extends AbstractCommand {
  public command = 'join';
  public aliases: string[] = ['apply'];
  public requiresPrefix = true;
  public requiresGuild = true;

  constructor(client: Client) {
    super(client);
    this.listeners.push(DiscordEvents.MESSAGE);
    this.listeners.push(DiscordEvents.GUILD_MEMBER_ADD);
    this.listeners.push(DiscordEvents.REACTION_ADD);
    this.listeners.push(DiscordEvents.REACTION_REMOVE);
  }

  async onMessage(joinMessage: Discord.Message): Promise<void> {
    if (!(await this.matches(joinMessage))) {
      return;
    }
    const member = joinMessage.member;
    const guildId = joinMessage.guild.id;
    joinMessage.member.send(Join.MSG_RESPONSE_1(member)).then(messages => {
      const msg = messages as Discord.Message;
      msg.react('✅').then(() => msg.react('❌'));
      joinMessage.channel.send(`${member}, i have sent you a direct message!`).catch(console.log);
      this.client.db
        .fetchUser(guildId, member.id)
        .then(user => {
          user.onInara = 'Not checked';
          user.inSquadron = 'Not checked';
          user.inaraName = '<no name specified>';
          user.notified = 'No';
          user.application = {
            startAt: new Date(),
            step: 'Started',
            dmChannelId: msg.channel.id,
            msgId: msg.id
          };
          return user;
        })
        .then(user => this.client.db.updateUser(guildId, user))
        .then(user => {
          return GoogleSheets.updateUser(this.client.bot.config, this.client.bot.config.sheets.members, user);
        });
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
      this.client.db.getInstance().find({ 'users.id': user.id, 'users.application': { $exists: true } } as any, (err: any, docs: any) => {
        if (!docs || docs.length == 0) {
          //no user found, nothing to do. the error happened somewhere else.
          console.log('no application found for user: ', user.id);
          return;
        }
        if (docs.length > 1) {
          user.send(`https://giphy.com/gifs/theviralfever-funny-lol-meme-jaeVcsuCOI2i5Yn0w5`).catch(console.log);
        }
        const doc = docs[0] as GuildEntry;
        this.client.db.fetchUser(doc._id, user.id).then(storedUser => {
          if (!storedUser.application) {
            //no application found, nothing to do. the error happened somewhere else.
            console.log('no application found for user: ', storedUser.id);
            return;
          }
          switch (storedUser.application.step) {
            case 'Started':
              reaction.message.delete().then(() =>
                user
                  .send(Join.MSG_RESPONSE_2)
                  .then(() => user.send({ embed: { description: Join.MSG_RESPONSE_3 } }))
                  .then(messages => {
                    const msg = messages as Discord.Message;
                    msg.react('✅').then(() => msg.react('❌'));
                    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                    storedUser.application!.step = 'In Progress';
                    return storedUser;
                  })
                  .then(user => {
                    return this.client.db.updateUser(doc._id, user);
                  })
                  .then(user => {
                    return GoogleSheets.updateUser(this.client.bot.config, this.client.bot.config.sheets.members, user);
                  })
                  .catch(console.log)
              );
              break;
            case 'In Progress':
              reaction.message.delete().then(() =>
                user
                  .send(Join.MSG_RESPONSE_4(user))
                  .then(() => {
                    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                    storedUser.application!.step = 'Finished';
                    storedUser.application!.finishedAt = new Date();
                    return storedUser;
                  })
                  .then(user => {
                    return this.client.db.updateUser(doc._id, user);
                  })
                  .then(user => {
                    return GoogleSheets.updateUser(this.client.bot.config, this.client.bot.config.sheets.members, user);
                  })
                  .catch(console.log)
              );
              break;
          }
        });
      });
    } else if (emoji === '❌') {
      user.send(Join.MSG_CANCEL_APPLICATION).catch(console.log);
      this.client.db.getInstance().find({ 'users.id': user.id, 'users.application': { $exists: true } }, (err: any, docs: any) => {
        if (!docs || docs.length == 0) {
          //no user found, nothing to do. the error happened somewhere else.
          console.log('no application found for user: ', user.id);
          return;
        }
        if (docs.length > 1) {
          console.log('multiple users found', docs);
          user.send(`https://giphy.com/gifs/theviralfever-funny-lol-meme-jaeVcsuCOI2i5Yn0w5`).catch(console.log);
        }
        const doc = docs[0] as GuildEntry;
        this.client.db
          .fetchUser(doc._id, user.id)
          .then(user => {
            if (!user.application) {
              //no application found, nothing to do. the error happened somewhere else.
              console.log('no application found for user: ', user.id);
              return;
            }
            user.application.canceledAt = new Date();
            user.application.step = 'Cancelled';
            return user;
          })
          .then(user => {
            if (user) return this.client.db.updateUser(doc._id, user);
          })
          .then(user => {
            if (user) return GoogleSheets.updateUser(this.client.bot.config, this.client.bot.config.sheets.members, user);
          });
      });
    } else {
      console.debug('Unknown emoji: ', emoji);
    }

    //console.log(reaction.emoji.id, reaction.emoji.identifier, reaction.emoji.name);
    //console.debug(`Added emoji ${reaction.emoji}, ${reaction.me}, ${user}`);
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
}

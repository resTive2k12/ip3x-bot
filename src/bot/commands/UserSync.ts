import * as Discord from 'discord.js';
import { Client } from '../api/client';
import { HelpField } from '../..';
import { AbstractCommand } from './AbstractCommand';
import { DiscordEvents } from '../core/DiscordEvents';
import { GoogleSheets } from '../../utilities/GoogleSheets';

import { User } from '../api/storage';
import { UserService } from '../../utilities/UserService';

export class UserSync extends AbstractCommand {
  prototype?: object | undefined;

  public command = 'user-sync';
  public aliases: string[] = ['some alias'];
  public requiresBotMention = true;
  public requiresAdminAccess = true;
  public requiresGuild = true;
  public applyHelp = false;
  private userStore: UserService;

  constructor(client: Client) {
    super(client);
    this.userStore = new UserService('datastore/users.store');
    this.listeners.push(DiscordEvents.MESSAGE);
  }

  /**
   * Gets called to every message command!
   * @param {Client} client the issueing Client
   * @param {Discord.Message} message the message
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async onMessage(message: Discord.Message): Promise<void> {
    if (!(await this.matches(message))) {
      return;
    }
    // the guild in which the command was issued is not configured
    if (this.client.bot.config.sheets.members.guildId !== message.guild.id) {
      return;
    }
    // we could not find the configured guilt
    const guild = this.client.guilds.get(message.guild.id);
    if (!guild) {
      return;
    }
    console.debug(`Checking guild ${guild.name} [${guild.id}]...`);
    let newUncheckedUserCount = 0;
    let knownUncheckedUserCount = 0;
    let knownCheckedUserCount = 0;
    let knownSpecialUserCount = 0;
    let knownBotUserCount = 0;
    let ignoredUserCount = 0;
    let unknownUserCount = 0;
    let newAcceptedUserCount = 0;
    let newDelayedUserCount = 0;
    GoogleSheets.readValues(this.client.bot.config, this.client.bot.config.sheets.members)
      .then(rows => {
        if (!rows) rows = [];
        guild.members.forEach(async member => {
          const idx = rows.findIndex(element => element != null && element[GoogleSheets.COL_ID] === member.id);
          if (idx >= 0) {
            //member was found in the sheet
            const user = GoogleSheets.arrayToUser(rows[idx], guild);
            user.name = member.nickname || member.user.username;
            if (this.isUnchecked(user)) {
              console.log(`${user.name} is unchecked...`);
              knownUncheckedUserCount += 1;
            }
            if (!this.isNotified(user)) {
              console.log(`${user.name} is not notified...`);
              if (this.isAccepted(user)) {
                console.log(`${user.name} got accepted...`);
                newAcceptedUserCount += 1;
                const dUser = this.client.users.get(user._id) as Discord.User;
                user.notified = 'Yes';

                dUser.send(UserSync.WELCOME_MSG(dUser));
                const dbGuild = await this.client.db.fetch(guild.id);
                if (dbGuild.recruitRoles) {
                  dbGuild.recruitRoles.forEach(role => {
                    member.addRole(role.id);
                  });
                }
                console.debug(`User ${user.name} got accepted`);
              } else if (this.isDelayed(user)) {
                console.log(`${user} got rejected...`);
                const dUser = this.client.users.get(user._id) as Discord.User;
                user.notified = 'Yes';
                user.application!.step = 'Rejected';
                user.comment = 'User got automatically rejected. Application took longer than "allowed".';
                dUser.send(UserSync.MSG_REJECTED);
                newDelayedUserCount += 1;
              }
            } else if (this.isChecked(user)) {
              console.log(`${user.name} is checked...`);
              knownCheckedUserCount += 1;
            } else if (this.isBot(user)) {
              console.log(`${user.name} is bot...`);
              knownBotUserCount += 1;
            } else if (this.isSpecial(user)) {
              console.log(`${user.name} is special...`);
              knownSpecialUserCount += 1;
            } else if (this.isIgnored(user)) {
              console.log(`${user.name} is ignored...`);
              ignoredUserCount += 1;
            } else {
              console.log(`${user.name} is unknown...`);
              unknownUserCount += 1;
            }

            rows.splice(idx, 1, GoogleSheets.userToArray(user));
          } else {
            //member was not found in the sheet
            const user = this.createNewUser(member);
            if (this.isBot(user)) {
              knownBotUserCount += 1;
            } else {
              newUncheckedUserCount += 1;
              console.debug(`\t- User ${user.name} not found in google document.`);
            }
            rows.push(GoogleSheets.userToArray(user));
            this.userStore.updateOrInsert(user);
          }
        });
        return rows;
      })
      .then(rows => {
        GoogleSheets.saveValues(this.client.bot.config, this.client.bot.config.sheets.members, rows)
          .then(values => {
            return message
              .reply({
                embed: {
                  title: ':white_check_mark: User synchronization succeeded.',
                  description:
                    '[GoogleDrive - Document](https://docs.google.com/spreadsheets/d/' +
                    this.client.bot.config.sheets.members.id +
                    " 'Members list on google drive')",
                  fields: [
                    {
                      name: '__Unchecked users__',
                      value: `There are **${newUncheckedUserCount}** __new__ unchecked users and **${knownUncheckedUserCount}** __known__ unchecked users.`
                    },
                    {
                      name: '__Notified users__',
                      value: `There are **${newAcceptedUserCount}** users __accepted__ and **${newDelayedUserCount}** __delayed users__ rejected.`
                    },
                    {
                      name: '__Checked or special users__',
                      value: `There are **${knownCheckedUserCount}** users __checked__ and **${knownSpecialUserCount}** users with __special roles__.`
                    },
                    {
                      name: '__Ignored or Bot users__',
                      value: `There are **${ignoredUserCount}** __ignored__ users and **${knownBotUserCount}** users identified as __bots__.`
                    },
                    {
                      name: '__Unknown states__',
                      value: `There are **${unknownUserCount}** users with a __not specified__ status.`
                    }
                  ],
                  footer: {
                    text: 'Parsed from GoogleDrive',
                    // eslint-disable-next-line @typescript-eslint/camelcase
                    icon_url: 'http://icons.iconarchive.com/icons/marcus-roberto/google-play/256/Google-Drive-icon.png'
                  }
                }
              })
              .then(() => /*message.delete()*/ console.log('maybe delete msg'));
          })
          .catch(reason => {
            message.reply(':warning: User synchronization failed.');
            console.log(reason);
          });
      });
  }

  private isUnchecked(user: User): boolean {
    return user.onInara === 'Not checked' || user.inSquadron === 'Not checked';
  }

  private isChecked(user: User): boolean {
    return user.onInara === 'Yes' && user.inSquadron === 'Yes';
  }

  private isSpecial(user: User): boolean {
    return (user.onInara !== 'Not checked' && user.onInara !== 'Yes') || (user.inSquadron !== 'Not checked' && user.inSquadron !== 'Yes');
  }

  private isIgnored(user: User): boolean {
    return user.onInara == 'Ignore' || user.inSquadron == 'Ignore';
  }

  private isBot(user: User): boolean {
    return user.onInara == 'Bot' || user.inSquadron == 'Bot';
  }

  private isAccepted(user: User): boolean {
    let accepted = user.inSquadron === 'Yes';
    console.log('in squadron', accepted);
    accepted = accepted && user.onInara === 'Yes';
    console.log('in squadron', accepted);
    accepted = accepted && !!user.inaraName;
    console.log('inaraname', accepted, user.inaraName);
    return accepted;
  }

  private isNotified(user: User): boolean {
    return user.notified !== 'No';
  }

  private isDelayed(user: User): boolean {
    //No application -> no delay possible
    if (!user.application) return false;
    //If user finished application no delay warning
    if (user.application.finishedAt) return false;
    const delay = this.dateDiff(user.application.startAt, new Date());
    console.debug(`User ${user.name} is delayed by ${delay} days...`);
    return delay > 3;
  }

  private dateDiff(date1: Date, date2: Date): number {
    const diffTime = Math.abs(date2.getTime() - date1.getTime());
    const diffDays = diffTime / (1000 * 60 * 60 * 24);
    return diffDays;
  }

  private createNewUser(member: Discord.GuildMember): User {
    const user: User = {
      _id: member.id,
      guildId: member.guild.id,
      joinedAt: member.joinedAt,
      isBot: member.user.bot,
      name: member.nickname || member.user.username,
      onInara: member.user.bot ? 'Bot' : 'Not checked',
      inSquadron: member.user.bot ? 'Bot' : 'Not checked',
      notified: member.user.bot ? 'Bot' : 'Ignore',
      comment: member.user.bot ? 'Bot user. Do not modify!' : 'Found at synchronization. This user is "unchecked" but will never be notified, unless changed to "No".'
    };
    return user;
  }

  help(): HelpField[] {
    return [{ name: this.client.bot.config.prefix + this.command, value: 'Unspecified help' }];
  }

  public static WELCOME_MSG = (x: Discord.User): string => `**Welcome to IP3X, CMDR ${x} o7**
Good news! Your application was verified and you’re now a :seedling: Recruit of **IP3X**.

You should now be able to see the private channels, where most of the action takes place.

:hash: **Important Channels**
#squadron - This is where most activity takes place.
#🔔announcements - You should always read new posts here.
#bgs_information - Important information, all members should take note.
#bgs_operations - For those ranked 🔱 Spec Ops, or higher, to discuss BGS.

:information_source: **Useful Links**
Please check the #useful_links channel.
_We do expect you to be aware of the following - please read these at your leisure:_
[IP3X Ranks & Progression](https://inara.cz/squadron-documents/6172/1798/)
[IP3X Corporation & BGS](https://inara.cz/squadron-documents/6172/1882/)

:hash: **Useful Discord Commands**
_All of these commands can be used in the #squadron channel._

**!mission** - _Display current Squadron missions to help our in-game faction._
**@Wing Finder find** - _If you’re looking to wing with other members._
**@Wing Finder help** - _For full list of commands to help you find a wing with others._

:closed_lock_with_key:  **Private Group**
It is useful to join our Private Group _in-game_, so that you can play with other members.

:one: In _Elite: Dangerous_, go to the :pause_button: Main Menu :arrow_right: Social :arrow_right: Groups
:two: In the top right where it says ‘enter commander name’, type: **Evil Tactician**
:three: Click on Evil Tactician once found and select _Request Join Group_.`;

  public static MSG_FAIL = `Unfortunately, something went wrong during your application.

Please contact someone in IP3X Leadership on Discord, so we can try and resolve this for you.`;

  public static MSG_REJECTED = `Unfortunately, your did not finish the application within 3 days.

Please contact someone in IP3X Leadership on Discord, so we can try and resolve this for you.

Or use the **!join** command again to restart the application process`;
}

import * as Discord from 'discord.js';
import { Client } from '../api/client';
import { HelpField } from '../..';
import { AbstractCommand } from './AbstractCommand';
import { DiscordEvents } from '../core/DiscordEvents';
import { GoogleSheets } from '../../utilities/GoogleSheets';

import { User, Validation, Notification, ApplicationStep } from '../api/storage';
import { formatDate } from '../../utilities/Utilities';
import { UserService } from '../../utilities/UserService';
import { applyChange } from 'deep-diff';

export class Tests extends AbstractCommand {
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
        guild.members.forEach(member => {
          const idx = rows.findIndex(element => element != null && element[GoogleSheets.COL_ID] === member.id);
          if (idx >= 0) {
            //member was found in the sheet
            const user = this.arrayToUser(rows[idx], guild);
            console.debug(`\t- User ${user.name} found in google document.`);
            if (this.isUnchecked(user)) {
              knownUncheckedUserCount += 1;
            } else if (!this.isNotified(user)) {
              if (this.isAccepted(user)) {
                //TODO
                newAcceptedUserCount += 1;
                console.debug(`User ${user.name} got accepted`);
              } else if (this.isDelayed(user)) {
                //TODO
                newDelayedUserCount += 1;
              }
            } else if (this.isChecked(user)) {
              knownCheckedUserCount += 1;
            } else if (this.isBot(user)) {
              knownBotUserCount += 1;
            } else if (this.isSpecial(user)) {
              knownSpecialUserCount += 1;
            } else if (this.isIgnored(user)) {
              ignoredUserCount += 1;
            } else {
              unknownUserCount += 1;
            }
          } else {
            //member was not found in the sheet
            const user = this.createNewUser(member);
            if (this.isBot(user)) {
              knownBotUserCount += 1;
            } else {
              newUncheckedUserCount += 1;
              console.debug(`\t- User ${user.name} not found in google document.`);
            }
            rows.push(this.userToArray(user));
            this.userStore.insert(user);
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
                      value: `There are **${newAcceptedUserCount}** users __accepted__ and **${newDelayedUserCount}** __delayed users__ notified.`
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
              .then(() => message.delete());
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
    let accepted = user.inSquadron !== 'Not checked';
    accepted = accepted && user.onInara !== 'Not checked';
    accepted = accepted && !!user.inaraName;
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
      notified: member.user.bot ? 'Bot' : 'No',
      comment: member.user.bot ? 'Bot user. Do not modify!' : undefined
    };
    return user;
  }

  private userToArray(user: User): Array<string | null> {
    let userArray: (string | null)[] = [];
    if (user._id) userArray[GoogleSheets.COL_ID] = user._id;
    userArray = this.setValue(GoogleSheets.COL_ID, user._id, userArray);
    userArray = this.setValue(GoogleSheets.COL_NAME, user.name, userArray);
    userArray = this.setValue(GoogleSheets.COL_ON_INARA, user.onInara, userArray);
    userArray = this.setValue(GoogleSheets.COL_INARA_NAME, user.inaraName ? user.inaraName : null, userArray);
    userArray = this.setValue(GoogleSheets.COL_IN_SQUADRON, user.inSquadron, userArray);
    userArray = this.setValue(GoogleSheets.COL_COMMENT, user.comment ? user.comment : 'Found while syncing. Entry needs to be manually completed.', userArray);
    userArray = this.setValue(GoogleSheets.COL_JOINED, formatDate(user.joinedAt), userArray);
    userArray = this.setValue(GoogleSheets.COL_APPLICATION_USER_NOTIFIED, user.notified, userArray);
    return userArray;
  }

  private arrayToUser(userArray: Array<string | null>, guild: Discord.Guild): User {
    const user: User = {
      _id: userArray[GoogleSheets.COL_ID] as string,
      guildId: guild.id,
      name: userArray[GoogleSheets.COL_NAME] as string,
      joinedAt: new Date(userArray[GoogleSheets.COL_NAME] as string),
      onInara: userArray[GoogleSheets.COL_ON_INARA] as Validation,
      inSquadron: userArray[GoogleSheets.COL_IN_SQUADRON] as Validation,
      isBot: userArray[GoogleSheets.COL_ON_INARA] === 'Bot',
      notified: userArray[GoogleSheets.COL_APPLICATION_USER_NOTIFIED] as Notification,
      comment: userArray[GoogleSheets.COL_COMMENT] as string
    };

    if (userArray[GoogleSheets.COL_APPLICATION_STATUS]) {
      user.application = {
        startAt: new Date(userArray[GoogleSheets.COL_APPLICATION_START] as string),
        finishedAt: userArray[GoogleSheets.COL_APPLICATION_FINISHED] ? new Date(userArray[GoogleSheets.COL_APPLICATION_FINISHED] as string) : undefined,
        step: userArray[GoogleSheets.COL_APPLICATION_STATUS] as ApplicationStep
      };
    }

    return user;
  }

  private setValue(col: number, value: string | null, currentArray: Array<string | null>): Array<string | null> {
    const newArray = currentArray;
    newArray[col] = value;
    return newArray;
  }

  help(): HelpField[] {
    return [{ name: this.client.bot.config.prefix + this.command, value: 'Unspecified help' }];
  }
}

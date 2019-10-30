import { google } from 'googleapis';
import { JWT, CredentialBody } from 'google-auth-library';
import { BotConfig, Sheet } from '../bot/api/botconfig';
import { User, ApplicationStep, Notification, Validation } from '../bot/api/storage';
import { formatDate } from './Utilities';
import * as Discord from 'discord.js';

export class GoogleSheets {
  private static SCOPES = ['https://www.googleapis.com/auth/spreadsheets'];

  public static async auth(credentials: CredentialBody): Promise<JWT> {
    const auth = new google.auth.GoogleAuth({
      //keyFile: "./config/ip3x-jwt.json",
      credentials: credentials,
      scopes: GoogleSheets.SCOPES
    });
    new google.auth.GoogleAuth({});
    return auth.getClient() as Promise<JWT>;
  }

  public static async readValues(config: BotConfig, sheet: Sheet): Promise<Array<Array<string | null>>> {
    return GoogleSheets.auth(config.credentials).then(jwt => {
      const request = {
        // The ID of the spreadsheet to retrieve data from.
        spreadsheetId: sheet.id,
        majorDimension: 'ROWS',
        range: `${sheet.tab}!${sheet.range}`,
        auth: jwt
      };
      const sheetsv4 = google.sheets('v4');
      return new Promise<Array<Array<string>>>((resolve, reject) => {
        sheetsv4.spreadsheets.values.get(request, (err: any, response: any) => {
          if (err) {
            reject(err);
          }
          resolve(response.data.values);
        });
      });
    });
  }

  public static async saveValues(config: BotConfig, sheet: Sheet, values: Array<Array<string | null>>): Promise<Array<Array<string | null>>> {
    return GoogleSheets.auth(config.credentials).then(jwt => {
      values.sort((a, b) => {
        if (a == null || b == null) {
          return 0;
        }
        if (a[GoogleSheets.COL_ON_INARA] === 'Not checked' && b[GoogleSheets.COL_ON_INARA] !== 'Not checked') {
          //console.log('a not checked');
          return -1;
        }
        if (a[GoogleSheets.COL_ON_INARA] !== 'Not checked' && b[GoogleSheets.COL_ON_INARA] === 'Not checked') {
          //console.log('b not checked');
          return 1;
        }
        if ((a[GoogleSheets.COL_INARA_NAME] as string).startsWith('BOT<') && !(b[GoogleSheets.COL_INARA_NAME] as string).startsWith('BOT<')) {
          return -11;
        }
        if (!(a[GoogleSheets.COL_INARA_NAME] as string).startsWith('BOT<') && (b[GoogleSheets.COL_INARA_NAME] as string).startsWith('BOT<')) {
          return 1;
        }
        return a[GoogleSheets.COL_NAME]!.localeCompare(b[GoogleSheets.COL_NAME]!);
      });
      const updateRequest = {
        spreadsheetId: sheet.id,
        auth: jwt,
        resource: {
          valueInputOption: 'RAW',
          data: [
            {
              majorDimension: 'ROWS',
              range: `${sheet.tab}!${sheet.range}`,
              values: values
            }
          ]
        }
      };
      const sheetsv4 = google.sheets('v4');
      return new Promise<Array<Array<string | null>>>((resolve, reject) => {
        sheetsv4.spreadsheets.values.batchUpdate(updateRequest, (err: any, response: any) => {
          if (err) {
            reject(err);
          }
          if (response.status !== 200) {
            reject(response.statusText);
          }
          resolve(values);
        });
      });
    });
  }

  public static updateUser(config: BotConfig, sheet: Sheet, user: User): any {
    GoogleSheets.readValues(config, config.sheets.members)
      .then(rows => {
        if (!rows) {
          rows = [];
          rows.push(GoogleSheets.userToArray(user));
        } else {
          const idx = rows.findIndex(element => element != null && element[GoogleSheets.COL_ID] === user._id);
          rows.splice(idx, 1, GoogleSheets.userToArray(user));
        }

        return rows;
      })
      .then(rows => GoogleSheets.saveValues(config, config.sheets.members, rows))
      .catch(console.log);
  }

  public static setValue(col: number, value: string | null, currentArray: Array<string | null>): Array<string | null> {
    const newArray = currentArray;
    newArray[col] = value;
    return newArray;
  }

  public static userToArray(user: User): Array<string | null> {
    let userArray: (string | null)[] = [];
    if (user._id) userArray[GoogleSheets.COL_ID] = user._id;
    userArray = GoogleSheets.setValue(GoogleSheets.COL_ID, user._id, userArray);
    userArray = GoogleSheets.setValue(GoogleSheets.COL_NAME, user.name, userArray);
    userArray = GoogleSheets.setValue(GoogleSheets.COL_ON_INARA, user.onInara ? user.onInara : 'Not checked', userArray);
    userArray = GoogleSheets.setValue(GoogleSheets.COL_INARA_NAME, user.inaraName ? user.inaraName : '', userArray);
    userArray = GoogleSheets.setValue(GoogleSheets.COL_IN_SQUADRON, user.inSquadron ? user.inSquadron : 'Not checked', userArray);
    userArray = GoogleSheets.setValue(
      GoogleSheets.COL_COMMENT,
      user.comment ? user.comment : 'Found while syncing. Entry needs to be manually completed.',
      userArray
    );
    userArray = GoogleSheets.setValue(GoogleSheets.COL_JOINED, formatDate(user.joinedAt), userArray);
    userArray = GoogleSheets.setValue(GoogleSheets.COL_APPLICATION_USER_NOTIFIED, user.notified, userArray);
    if (user.leftAt) {
      userArray = GoogleSheets.setValue(GoogleSheets.COL_LEFT, formatDate(user.leftAt), userArray);
    }
    if (user.application && user.applicationStep != 'Ignore') {
      console.debug(`${user.name} has application`, user.application);
      userArray = GoogleSheets.setValue(GoogleSheets.COL_APPLICATION_START, user.application.startAt ? formatDate(user.application.startAt) : '', userArray);
      userArray = GoogleSheets.setValue(GoogleSheets.COL_APPLICATION_STATUS, user.applicationStep, userArray);
      userArray = GoogleSheets.setValue(
        GoogleSheets.COL_APPLICATION_FINISHED,
        user.application.finishedAt ? formatDate(user.application.finishedAt) : '',
        userArray
      );
    } else {
      console.debug(`${user.name} has <no> application`, user.application);
      userArray[GoogleSheets.COL_APPLICATION_START] = '';
      userArray[GoogleSheets.COL_APPLICATION_STATUS] = 'Ignore';
      userArray[GoogleSheets.COL_APPLICATION_FINISHED] = '';
    }
    userArray = GoogleSheets.setValue(GoogleSheets.COL_LAST_UPDATE, formatDate(new Date()), userArray);
    return userArray;
  }

  public static arrayToUser(userArray: Array<string | null>, guild: Discord.Guild): User {
    const user: User = {
      _id: userArray[GoogleSheets.COL_ID] as string,
      guildId: guild.id,
      name: userArray[GoogleSheets.COL_NAME] as string,
      joinedAt: new Date(Date.parse(userArray[GoogleSheets.COL_JOINED] as string)),
      onInara: userArray[GoogleSheets.COL_ON_INARA] as Validation,
      inaraName: userArray[GoogleSheets.COL_INARA_NAME] as string,
      inSquadron: userArray[GoogleSheets.COL_IN_SQUADRON] as Validation,
      isBot: userArray[GoogleSheets.COL_ON_INARA] === 'Bot',
      notified: userArray[GoogleSheets.COL_APPLICATION_USER_NOTIFIED] as Notification,
      comment: userArray[GoogleSheets.COL_COMMENT] as string,
      applicationStep: userArray[GoogleSheets.COL_APPLICATION_STATUS] as ApplicationStep,

    };

    if (userArray[GoogleSheets.COL_LEFT]) {
      user.leftAt = new Date(Date.parse(userArray[GoogleSheets.COL_LEFT] as string));
    }

    if (userArray[GoogleSheets.COL_APPLICATION_STATUS] !== 'Ignore') {
      user.application = {
        startAt: new Date(Date.parse(userArray[GoogleSheets.COL_APPLICATION_START] as string)),
        finishedAt: userArray[GoogleSheets.COL_APPLICATION_FINISHED]
          ? new Date(Date.parse(userArray[GoogleSheets.COL_APPLICATION_FINISHED] as string))
          : undefined,

      };
    } else {
      user.applicationStep = 'Ignore';
      user.application = undefined;
    }

    return user;
  }

  public static COL_NAME = 0;
  public static COL_ON_INARA = 1;
  public static COL_INARA_NAME = 2;
  public static COL_IN_SQUADRON = 3;
  public static COL_APPLICATION_STATUS = 4;
  public static COL_APPLICATION_USER_NOTIFIED = 5;
  public static COL_COMMENT = 6;
  public static COL_APPLICATION_START = 7;
  public static COL_APPLICATION_FINISHED = 8;
  public static COL_JOINED = 9;
  public static COL_LEFT = 10;
  public static COL_LAST_UPDATE = 11;
  public static COL_ID = 12;
}

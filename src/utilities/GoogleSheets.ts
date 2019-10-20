import { google } from 'googleapis';
import { JWT, CredentialBody } from 'google-auth-library';
import { BotConfig, Sheet } from '../bot/api/botconfig';
import { User } from '../bot/api/storage';
import { MemberController } from '../bot/controllers/MemberController';
import { formatDate } from './Utilities';

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

  public static async saveValues(config: BotConfig, sheet: Sheet, values: Array<Array<string | null>>): Promise<any> {
    return GoogleSheets.auth(config.credentials)
      .then(jwt => {
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
        return new Promise<string[]>((resolve, reject) => {
          sheetsv4.spreadsheets.values.batchUpdate(updateRequest, (err: any, response: any) => {
            if (err) {
              reject(err);
            }
            resolve(response);
          });
        });
      })
      .catch(console.log);
  }

  public static updateUser(config: BotConfig, sheet: Sheet, user: User): any {
    GoogleSheets.readValues(config, sheet)
      .then(rows => {
        if (!rows) return [];
        const idx = rows.findIndex(element => element != null && element[GoogleSheets.COL_ID] === user.id);
        let changed = false;
        let row: (string | null)[] = [];
        if (idx >= 0) {
          row = rows[idx];
        }

        const result = GoogleSheets.fromDbToSheet(row, user);
        changed = changed || result.changed;
        row = result.row;
        if (idx < 0) {
          rows.push(row);
        } else {
          rows[idx] = row;
        }
        if (changed) {
          console.log(`returning ${rows.length} rows`);
          return rows;
        }
        return [];
      })
      .then(rows => GoogleSheets.saveValues(config, sheet, rows))
      .catch(console.log);
  }

  public static fromDbToSheet(row: (string | null)[], user: User): { changed: boolean; row: (string | null)[] } {
    const changedContent: number[] = [];
    if (row[GoogleSheets.COL_ID] !== user.id) {
      row[GoogleSheets.COL_ID] = user.id;
      changedContent.push(GoogleSheets.COL_ID);
    }
    if (row[GoogleSheets.COL_NAME] !== user.name) {
      row[GoogleSheets.COL_NAME] = user.name;
      changedContent.push(GoogleSheets.COL_NAME);
    }
    if (row[GoogleSheets.COL_JOINED] !== formatDate(user.joinedAt)) {
      row[GoogleSheets.COL_JOINED] = formatDate(user.joinedAt);
      changedContent.push(GoogleSheets.COL_JOINED);
    }
    if (user.leftAt && row[GoogleSheets.COL_LEFT] !== formatDate(user.leftAt)) {
      row[GoogleSheets.COL_LEFT] = formatDate(user.leftAt);
      changedContent.push(GoogleSheets.COL_LEFT);
    }
    if (user.application && row[GoogleSheets.COL_APPLICATION_START] !== formatDate(user.application.startAt)) {
      row[GoogleSheets.COL_APPLICATION_START] = formatDate(user.application.startAt);
      changedContent.push(GoogleSheets.COL_APPLICATION_START);
    }
    if (user.comment && row[GoogleSheets.COL_APPLICATION_COMMENT] !== user.comment) {
      row[GoogleSheets.COL_APPLICATION_COMMENT] = user.comment;
      changedContent.push(GoogleSheets.COL_APPLICATION_COMMENT);
    }
    if (user.application && row[GoogleSheets.COL_APPLICATION_STATUS] != user.application.step) {
      row[GoogleSheets.COL_APPLICATION_STATUS] = user.application.step;
      changedContent.push(GoogleSheets.COL_APPLICATION_STATUS);
    }
    if (row[GoogleSheets.COL_ON_INARA] != (user.onInara || 'Not checked')) {
      row[GoogleSheets.COL_ON_INARA] = user.onInara || 'Not checked';
      changedContent.push(GoogleSheets.COL_ON_INARA);
    }
    if (row[GoogleSheets.COL_IN_SQUADRON] != (user.inSquadron || 'Not checked')) {
      row[GoogleSheets.COL_IN_SQUADRON] = user.inSquadron || 'Not checked';
      changedContent.push(GoogleSheets.COL_IN_SQUADRON);
    }
    if (row[GoogleSheets.COL_INARA_NAME] != (user.inaraName || '')) {
      row[GoogleSheets.COL_INARA_NAME] = user.inaraName || '';
      changedContent.push(GoogleSheets.COL_INARA_NAME);
    }
    if (row[GoogleSheets.COL_APPLICATION_USER_NOTIFIED] != user.notified) {
      row[GoogleSheets.COL_APPLICATION_USER_NOTIFIED] = user.notified;
      changedContent.push(GoogleSheets.COL_APPLICATION_USER_NOTIFIED);
    }
    if (user.application && user.application.finishedAt && row[GoogleSheets.COL_APPLICATION_FINISHED] !== formatDate(user.application.finishedAt)) {
      row[GoogleSheets.COL_APPLICATION_FINISHED] = formatDate(user.application.finishedAt);
      changedContent.push(GoogleSheets.COL_APPLICATION_FINISHED);
    }

    if (changedContent.length > 0) {
      row[GoogleSheets.COL_LAST_UPDATE] = formatDate(new Date()) + ' - columns:' + changedContent.join(',');
      return { changed: true, row: row };
    }
    return { changed: false, row: row };
  }

  public static COL_NAME = 0;
  public static COL_ON_INARA = 1;
  public static COL_INARA_NAME = 2;
  public static COL_IN_SQUADRON = 3;
  public static COL_APPLICATION_STATUS = 4;
  public static COL_APPLICATION_USER_NOTIFIED = 5;
  public static COL_APPLICATION_COMMENT = 6;
  public static COL_APPLICATION_START = 7;
  public static COL_APPLICATION_FINISHED = 8;
  public static COL_JOINED = 9;
  public static COL_LEFT = 10;
  public static COL_LAST_UPDATE = 11;
  public static COL_ID = 12;
}

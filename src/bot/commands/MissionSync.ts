import { Client } from "../api/client";
import * as Discord from "discord.js";
import { AbstractCommand } from "./AbstractCommand";
import { HelpField } from "../..";
import { DiscordEvents } from "../core/DiscordEvents";
import { GoogleSheets } from "../../utilities/GoogleSheets";
import { google } from "googleapis";
import { MissionEntry } from "../api/storage";

export class MissionSync extends AbstractCommand {
  public command = "mission-sync";
  public aliases = ['objectives-sync'];
  public requiresAdminAccess = true;
  public requiresBotMention = true;
  public requiresGuild = true;


  constructor(client: Client) {
    super(client);
    this.listeners.push(DiscordEvents.MESSAGE);
  }

  async onMessage(message: Discord.Message): Promise<void> {
    if (!(await this.matches(message))) {
      return;
    }
    this.synchronize(message);
  }

  private synchronize(message: Discord.Message): void {
    message.channel.send("Synchronizing mission objectives: authenticating", {}).then(message => {
      if (message instanceof Discord.Message) {
        GoogleSheets.auth(this.client.bot.config.credentials).then(
          succ => {
            message.edit("Synchronizing mission objectives: authenticated");
            const request = {
              // The ID of the spreadsheet to retrieve data from.
              spreadsheetId: "1AS0CYbHhMTYO9ogqE8Pxn6N7DJBVPsiAJW05E-K5Uuw", // TODO: Update placeholder value.
              // The A1 notation of the values to retrieve.
              range: "IP3X Assistant Config!A6:C18", // TODO: Update placeholder value.

              auth: succ
            };
            const sheets = google.sheets("v4");

            sheets.spreadsheets.values.get(request, (err: any, response: any) => {
              if (err) {
                message.edit("Synchronizing mission objectives: parsing failed...");
                console.error(err);
                return;
              }
              message.edit("Synchronizing mission objectives: parsing data...");
              let mission: MissionEntry;
              response.data.values.forEach((element: any) => {
                if (element[0] === "Title" && element[2]) {
                  mission = { title: element[2], objectives: [], description: "", lastSync: Date.now() };
                } else if (element[0] === "Description" && element[2]) {
                  mission.description = element[2];
                } else if (element[0] === "Field" && element[2]) {
                  mission.objectives.push({ title: element[1], description: element[2] });
                }
              });
              this.db.fetch(message.guild.id).then(entry => {
                entry.mission = mission;
                this.db.update(entry);
                message.edit("Synchronizing mission objectives: parsing finished; data updated...");
              });
            });
          },
          err => {
            message.edit("Synchronizing mission objectives: authentication failed...");
            console.error("auth error", err);
          }
        );
        console.log(message.id, message.content);
      }
    });
  }

  help(): HelpField[] {
    return [{ name: "mission-sync", value: "Updates the current objectives.", inline: false }];
  }
}

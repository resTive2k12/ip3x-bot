import { Client } from "../api/client";
import * as Discord from "discord.js";
import { AbstractCommand } from "./AbstractCommand";
import { HelpField } from "../..";
import { DiscordEvents } from "../core/DiscordEvents";
import { GoogleSheets } from "../../utilities/GoogleSheets";
import { google } from "googleapis";
import { MissionEntry } from "../api/storage";

export class MissionCommand extends AbstractCommand {
    public command = "mission";
    public aliases: string[] = ['objectives'];

    

    constructor(client: Client) {
        super(client);
        this.listeners.push(DiscordEvents.MESSAGE);
    }

    onMessage(message:Discord.Message) {
        if (message.author.bot) return;
        console.debug(`${this.constructor.name} just recived the message: ${message.cleanContent}.`);
        const parsed = this.parseMessageIntoParameters(message);

        const mention = this.getUserFromMention(parsed[0]);
        const botMentioned = mention && mention.id === this.client.user.id;

        if (botMentioned) {
            console.debug(`${this.constructor.name}: Performing administrative commands...`);
            const inputCommand = parsed[1].slice(this.client.bot.config.prefix.length);
            if (!this.isAdmin(message)) {
                //fail silently because user is not allowed.
                return;
            }
            if (inputCommand === this.command && parsed[2] === 'sync')  {
                this.synchronize(message);
            }
            return;
        };
        const inputCommand = parsed[0].slice(this.client.bot.config.prefix.length);
        if (inputCommand === this.command) {
            // console.debug(`${this.constructor.name}: Performing user command...`);
            this.showMission(message);
        }
    }

    showMission(message: Discord.Message): void {
        if (!message.guild) {
            message.channel.send(`${message.author} Make sure, you are not sending this in a direct message.`);
            return;
        }
        this.db
            .fetch(message.guild.id)
            .then(doc => {
                if (!doc || !doc.mission || doc.mission.objectives.length === 0) {
                    message.channel.send(`:information_source: ${message.member} there are currently no objectives!`);
                } else {
                    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                    const embed = new Discord.RichEmbed();
                    embed.setTitle(doc.mission.title);
                    embed.setDescription(doc.mission.description || "");
                    embed.attachFiles(["./images/logo-90-90.png"]);
                    embed.setAuthor("IP3X Command", "attachment://logo-90-90.png");
                    embed.setColor(0x00ff00);
                    embed.setTimestamp(doc.mission.lastSync);

                    doc.mission.objectives.forEach(objective => {
                        embed.addField(`${objective.title}`, `${objective.description}`);
                    });
                    message.channel.send(embed);
                }
            })
            .catch(reason => {
                console.log("Error loading data", reason);
                message.channel.send(`${message.author} Error loading mission objectives. Check protocol..`);
            });
    }

    private synchronize(message: Discord.Message): void {
        message.channel.send("Snychronizing mission objectives: authenticating", {}).then(message => {
            if (message instanceof Discord.Message) {
                GoogleSheets.auth(this.client.bot.config.credentials).then(
                    succ => {
                        message.edit("Snychronizing mission objectives: authenticated");
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
                            let mission: MissionEntry
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
                        message.edit("Snychronizing mission objectives: authentication failed...");
                        console.error("auth error", err);
                    }
                );
                console.log(message.id, message.content);
            }
        });
    }

    help(): HelpField[] {
        return [{ name: "!mission", value: "Shows the current active objectives.", inline: false }];
    }
}

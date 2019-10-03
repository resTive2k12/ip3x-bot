import { Client } from "../api/client";
import * as Discord from "discord.js";
import { HelpField } from "../..";
import { AbstractCommand } from "./AbstractCommand";
import { GoogleSheets } from "../../utilities/GoogleSheets";
import { google } from "googleapis";
import { GuildEntry, MissionEntry } from "../api/storage";

export class AdminCommand extends AbstractCommand {
    public command = "config";
    public aliases: string[] = ["admin"];
    public botMentionMandatory = true;

    constructor(client: Client) {
        super(client);
    }

    run(message: Discord.Message, args: string[]): void {
        if (!this.isValid(message)) {
            return;
        }

        if (args.find(arg => arg === "bind-welcome-channel")) {
            this.setWelcomeChannel(message);
        } else if (args.find(arg => arg === "unbind-welcome-channel")) {
            this.unsetWelcomeChannel(message);
        } else if (args.find(arg => arg === "mission-clear")) {
            this.clearMissions(message);
        } else if (args.find(arg => arg === "mission-sync")) {
            message.channel.send("Snychronizing mission objectives: authenticating", {}).then(message => {
                if (message instanceof Discord.Message) {
                    GoogleSheets.auth().then(
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
                                    message.edit("Snychronizing mission objectives: parsing failed...");
                                    console.error(err);
                                    return;
                                }
                                message.edit("Snychronizing mission objectives: parsing data...");
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
                                    message.edit("Snychronizing mission objectives: parsing finished; data updated...");
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
        } else {
            message.channel.send("Could not find any configuration command. Try !help");
        }
    }

    isValid(message: Discord.Message): boolean {
        if (!message.member) {
            console.warn(`Message author ${message.author.username} is not a member of the server (anymore)`);
            return false;
        }

        const allowedRoles = [];
        allowedRoles.push(message.guild.roles.find(role => role.name.toLowerCase() === "admin"));
        allowedRoles.push(message.guild.roles.find(role => role.name === "IP3X Admiralty"));

        let hasAdminRole = false;

        allowedRoles.forEach(role => {
            if (role && message.member.roles.get(role.id)) {
                hasAdminRole = true;
            }
        });

        if (!hasAdminRole) {
            message.channel.send(`${message.member} you are not allowed to perform administrative actions.`);
            return false;
        }
        return true;
    }

    setWelcomeChannel(message: Discord.Message): void {
        this.db
            .fetch(message.guild.id)
            .then(async entry => {
                const doc = entry;
                doc.welcomeChannelId = message.channel.id;
                this.db
                    .update(doc)
                    .then(() => {
                        message.channel.send(`${message.member}: Welcome channel set to ${message.channel}`);
                    })
                    .catch(reason => {
                        console.log("Error updating welcome channel", reason);
                        message.channel.send(`${message.member} Error updating welcome. Check protocol.`);
                    });
            })
            .catch(reason => {
                if ((reason as Error).name === "ID not found") {
                    const newDoc: GuildEntry = { _id: message.guild.id, lastUpdate: Date.now(), welcomeChannelId: message.channel.id };
                    this.db.insert(newDoc).catch(reason => {
                        console.error("Error creating new empty guild-data", reason);
                    });
                } else {
                    console.error("Error fetch guild data", reason);
                }
            });
    }

    unsetWelcomeChannel(message: Discord.Message): void {
        this.db
            .fetch(message.guild.id)
            .then(doc => {
                if (doc.welcomeChannelId) {
                    doc.welcomeChannelId = undefined;
                    this.db
                        .update(doc)
                        .catch(reason => {
                            console.log(`error updating welcome channel for id "${message.guild.id}"`, reason);
                            message.channel.send(`${message.member} Error updating data. Check protocol.`);
                        })
                        .then(() => {
                            message.channel.send(`${message.member}: Welcome channel has been reset.`);
                        });
                }
            })
            .catch(reason => {
                console.log(`error fetching guilddata for id "${message.guild.id}"`, reason);
            });
    }

    clearMissions(message: Discord.Message): void {
        this.db
            .fetch(message.guild.id)
            .then(doc => {
                if (doc.mission) {
                    doc.mission = undefined;
                    this.db
                        .update(doc)
                        .catch(reason => {
                            console.log(`error updating mission data for id "${message.guild.id}"`, reason);
                            message.channel.send(`${message.member} Error updating data. Check protocol.`);
                        })
                        .then(() => {
                            message.channel.send(`${message.member}: Missions have been cleared`);
                        });
                }
            })
            .catch(reason => {
                console.log(`error fetching guilddata for id "${message.guild.id}"`, reason);
            });
    }

    help(): HelpField[] {
        return [
            { name: "!config", value: "Configuration for various aspects of this bot.\nUsage: `@IP3X Assistant !config <command>`\n\n" },
            { name: "bind-welcome-channel", value: `Binds the current channel to be the displaying channel for the welcome message. Overwrites previously configured channels silently.` },
            { name: "unbind-welcome-channel", value: `Removes any existing binding for the welcome channel. If no channel was set nothing happens.` },
            { name: "mission-clear", value: `Removes the description and all missions.` },
            { name: "mission-sync", value: `Synchronizes the current objectives with the well known google-sheet.` }
        ];
    }
}

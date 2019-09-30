import { Client } from "../api/client";
import * as Discord from "discord.js";
import { HelpField } from "../..";
import { AbstractCommand } from "./AbstractCommand";
import { GoogleSheets } from "../utilities/GoogleSheets";
import { google } from "googleapis";

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
            this.setWelcomeChannel(this.client.bot.config.db, message);
        } else if (args.find(arg => arg === "unbind-welcome-channel")) {
            this.unsetWelcomeChannel(this.client.bot.config.db, message);
        } else if (args.find(arg => arg === "mission-clear")) {
            this.clearMissions(this.client.bot.config.db, message);
        } else if (args.find(arg => arg === "mission-sync")) {
            message.channel.send('Snychronizing mission objectives: authenticating', {}).then(message => {
                if (message instanceof Discord.Message) {
                    GoogleSheets.auth().then(succ => {
                        message.edit('Snychronizing mission objectives: authenticated');
                        const request = {
                            // The ID of the spreadsheet to retrieve data from.
                            spreadsheetId: '1AS0CYbHhMTYO9ogqE8Pxn6N7DJBVPsiAJW05E-K5Uuw',  // TODO: Update placeholder value.

                            // The A1 notation of the values to retrieve.
                            range: 'IP3X Assistant Config!A6:C18',  // TODO: Update placeholder value.

                            // How values should be represented in the output.
                            // The default render option is ValueRenderOption.FORMATTED_VALUE.
                            //valueRenderOption: '',  // TODO: Update placeholder value.

                            // How dates, times, and durations should be represented in the output.
                            // This is ignored if value_render_option is
                            // FORMATTED_VALUE.
                            // The default dateTime render option is [DateTimeRenderOption.SERIAL_NUMBER].
                            //dateTimeRenderOption: '',  // TODO: Update placeholder value.

                            auth: succ,
                        };
                        const sheets = google.sheets('v4');

                        sheets.spreadsheets.values.get(request, (err: any, response: any) => {
                            if (err) {
                                message.edit('Snychronizing mission objectives: parsing failed...');
                                console.error(err);
                                return;
                            }
                            message.edit('Snychronizing mission objectives: parsing data...');
                            response.data.values.forEach((element: any) => {
                                console.log(element);
                            });
                        });

                    }, err => {
                        message.edit('Snychronizing mission objectives: authentication failed...');
                        console.error("auth error", err);
                    });
                    console.log(message.id, message.content);
                }

            });
        } else if (args.find(arg => arg === "mission-description")) {
            if (args[args.indexOf("mission-description") + 1]) {
                this.setMissionDescription(this.client.bot.config.db, message, args[args.indexOf("mission-description") + 1].replace(/\"/g, ""));
            }
        } else if (args.find(arg => arg.startsWith("mission-"))) {
            const re = /(mission-(primary|secondary|tertiary|quaternary|quinary|senary|septenary|octonary|nonary|denary)){1}/im;
            const ms = args.find(arg => arg.startsWith("mission-")) || "";
            const match = ms.match(re) || [];
            if (match[2] && args[args.indexOf(match[1]) + 1]) {
                this.setMission(this.client.bot.config.db, message, match[2], args[args.indexOf(match[1]) + 1].replace(/\"/g, ""));
            } else {
                message.channel.send("Could not read/parse mission description.");
            }
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

    setWelcomeChannel(db: Nedb, message: Discord.Message): void {
        db.findOne({ "guild-id": message.guild.id }, (err, doc) => {
            if (err) {
                console.error("error finding guild config", err);
                return;
            }
            if (doc === null) {
                console.debug(`no config entry found for guild ${message.guild.name}, ${message.guild.id}`);
                db.insert(
                    {
                        "guild-id": message.guild.id,
                        "welcome-channel": message.channel.id,
                        "last-update": Date.now()
                    },
                    (err, insertedDoc) => {
                        if (err) {
                            console.error(`Error inserting document: ${err}`);
                            return;
                        }
                        console.debug(`inserted document: ${insertedDoc}`);
                    }
                );
            } else {
                console.debug(`config entry found for guild ${message.guild.name}, ${message.guild.id}: ${doc._id}`);
                doc["welcome-channel"] = message.channel.id;
                doc["last-update"] = Date.now();
                db.update({ _id: doc._id }, doc, {}, (err: any, numAffected: any, affectedDocs: any, upsert: any) => {
                    console.log(err, numAffected, affectedDocs, upsert);
                });
                db.persistence.compactDatafile();
            }
            message.channel.send(`${message.member} the channel for the welcome message is now: ${(message.channel as Discord.TextChannel).name}`);
        });
    }

    unsetWelcomeChannel(db: Nedb, message: Discord.Message): void {
        db.findOne({ "guild-id": message.guild.id }, (err, doc) => {
            if (err) {
                console.error("error finding guild config", err);
                return;
            }
            if (!doc) {
                return;
            }
            doc["welcome-channel"] = undefined;
            db.update({ _id: doc._id }, doc);
            db.persistence.compactDatafile();
            message.channel.send(`${message.member} channel for welcome message cleared.`);
        });
    }

    clearMissions(db: Nedb<any>, message: Discord.Message): void {
        db.findOne({ "guild-id": message.guild.id }, (err, doc) => {
            if (err) {
                console.error(`Error loading config for server ${message.guild.name} (${message.guild.id})`);
            }
            if (doc == null) {
                doc = { "guild-id": message.guild.id, "last-update": Date.now() };
                db.insert(doc);
                db.persistence.compactDatafile();
            } else {
                doc.missions = undefined;
                doc["last-updated"] = Date.now();
                db.update({ _id: doc._id }, doc);
                db.persistence.compactDatafile();
            }
            message.channel.send(`${message.member} mission objectives have been cleared.`);
        });
    }

    setMission(db: Nedb<any>, message: Discord.Message, type: string, missiontext: string): void {
        db.findOne({ "guild-id": message.guild.id }, (err, doc) => {
            if (err) {
                console.error(`Error loading config for server ${message.guild.name} (${message.guild.id})`);
            }
            if (doc == null) {
                //console.log("inserting mission ", type, missiontext);
                doc = { "guild-id": message.guild.id, "last-update": Date.now() };
                doc.missions = {};
                doc.missions[type] = missiontext;
                db.insert(doc, (err, inserteddoc) => {
                    doc = inserteddoc;
                });
                db.persistence.compactDatafile();
            } else {
                //console.log("updating current mission ", type, missiontext, doc);
                doc["last-updated"] = Date.now();
                if (!doc.missions) doc.missions = {};
                doc.missions[type] = missiontext;
                db.update({ _id: doc._id }, doc);
                db.persistence.compactDatafile();
            }
        });
    }

    setMissionDescription(db: Nedb, message: Discord.Message, text: string): void {
        db.findOne({ "guild-id": message.guild.id }, (err, doc) => {
            if (err) {
                console.error("error finding guild config", err);
                return;
            }
            if (doc == null) {
                //console.log("inserting mission ", type, missiontext);
                doc = { "guild-id": message.guild.id, "last-update": Date.now() };
                doc.missions = {};
                doc.missions["description"] = text;
                db.insert(doc, (err, inserteddoc) => {
                    doc = inserteddoc;
                });
                db.persistence.compactDatafile();
            } else {
                //console.log("updating current mission ", type, missiontext, doc);
                doc["last-updated"] = Date.now();
                if (!doc.missions) doc.missions = {};
                doc.missions["description"] = text;
                db.update({ _id: doc._id }, doc);
                db.persistence.compactDatafile();
            }
        });
    }

    help(): HelpField[] {
        return [
            { name: "!config", value: "Configuration for various aspects of this bot.\nUsage: `@IP3X Assistant !config <command>`\n\n" },
            { name: "bind-welcome-channel", value: `Binds the current channel to be the displaying channel for the welcome message. Overwrites previously configured channels silently.` },
            { name: "unbind-welcome-channel", value: `Removes any existing binding for the welcome channel. If no channel was set nothing happens.` },
            { name: "mission-clear", value: `Removes the description and all missions.` },
            { name: "mission-sync", value: `Synchronizes tue current objectives with the well known google-sheet.` },
            { name: "*mission-_(primary|secondary|tertiary)_", value: `Sets the mission text for the mission.` },
            { name: "mission-_(quaternary|quinary|senary)_", value: `Sets the mission text for the mission.` },
            { name: "mission-_(septenary|octonary|nonary|denary)_", value: `Sets the mission text for the mission.` },
            { name: "mission-description", value: `A general description of the mission(s).` }

        ];
    }
}

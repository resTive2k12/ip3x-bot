import { Command } from "../api/command";
import { Client } from "../api/client";
import * as Discord from "discord.js";
import { Bot } from "../bot";
import { HelpField } from "../..";
import { BotConfig } from "../api/bot";

export class AdminCommand implements Command {
    private bot: Bot;

    constructor(bot: Bot) {
        this.bot = bot;
    }

    static matches(config: BotConfig, args: string[]): boolean {
        if (!args || args.length == 0) {
            return false;
        }
        const cmd = args[1];
        return !!cmd && cmd.startsWith(config.prefix + "config");
    };

    run(client: Client, message: Discord.Message, args: string[]): void {
        if (!this.isValid(client, message)) {
            return;
        }

        if (args.find(arg => arg === "set-welcome-channel")) {
            this.setWelcomeChannel(this.bot.config.db, message, client);
        } else if (args.find(arg => arg === "unset-welcome-channel")) {
            this.unsetWelcomeChannel(this.bot.config.db, message, client);
        } else if (args.find(arg => arg === "mission-clear")) {
            this.clearMissions(this.bot.config.db, client, message);
        } else if (args.find(arg => arg === "mission-description")) {
            if (args[args.indexOf("mission-description") + 1]) {
                this.setMissionDescription(this.bot.config.db, client, message, args[args.indexOf("mission-description") + 1].replace(/\"/g, ""));
            }
        } else if (args.find(arg => arg.startsWith("mission-"))) {
            const re = /(mission-(primary|secondary|tertiary|quaternary|quinary|senary|septenary|octonary|nonary|denary)){1}/im;
            const ms = args.find(arg => arg.startsWith("mission-")) || "";
            const match = ms.match(re) || [];
            if (match[2] && args[args.indexOf(match[1]) + 1]) {
                this.setMission(this.bot.config.db, client, message, match[2], args[args.indexOf(match[1]) + 1].replace(/\"/g, ""));
            } else {
                message.channel.send("Could not read/parse mission description.");
            }
        } else {
            message.channel.send("Could not find any configuration command. Try !help");
        }

    }

    isValid(client: Client, message: Discord.Message): boolean {
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

    setWelcomeChannel(db: Nedb, message: Discord.Message, client: Client): void {
        db.findOne({ "guild-id": message.guild.id }, (err, doc) => {
            if (err) {
                client.bot.logger.error("error finding guild config", err);
                return;
            }
            if (doc === null) {
                client.bot.logger.debug(`no config entry found for guild ${message.guild.name}, ${message.guild.id}`);
                db.insert(
                    {
                        "guild-id": message.guild.id,
                        "welcome-channel": message.channel.id,
                        "last-update": Date.now()
                    },
                    (err, insertedDoc) => {
                        if (err) {
                            client.bot.logger.error(`Error inserting document: ${err}`);
                            return;
                        }
                        client.bot.logger.debug(`inserted document: ${insertedDoc}`);
                    }
                );
            } else {
                client.bot.logger.debug(`config entry found for guild ${message.guild.name}, ${message.guild.id}: ${doc._id}`);
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

    unsetWelcomeChannel(db: Nedb, message: Discord.Message, client: Client): void {
        db.findOne({ "guild-id": message.guild.id }, (err, doc) => {
            if (err) {
                client.bot.logger.error("error finding guild config", err);
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

    clearMissions(db: Nedb<any>, client: Client, message: Discord.Message): void {
        db.findOne({ "guild-id": message.guild.id }, (err, doc) => {
            if (err) {
                client.bot.logger.error(`Error loading config for server ${message.guild.name} (${message.guild.id})`);
            }
            if (doc == null) {
                doc = { "guild-id": message.guild.id, "last-update": Date.now() };
                db.insert(doc);
                db.persistence.compactDatafile();
            }
            else {
                doc.missions = undefined;
                doc["last-updated"] = Date.now();
                db.update({ _id: doc._id }, doc);
                db.persistence.compactDatafile();

            }
            message.channel.send(`${message.member} mission objectives have been cleared.`);
        });
    }

    setMission(db: Nedb<any>, client: Client, message: Discord.Message, type: string, missiontext: string): void {
        db.findOne({ "guild-id": message.guild.id }, (err, doc) => {
            if (err) {
                client.bot.logger.error(`Error loading config for server ${message.guild.name} (${message.guild.id})`);
            }
            if (doc == null) {
                //console.log("inserting mission ", type, missiontext);
                doc = { "guild-id": message.guild.id, "last-update": Date.now() };
                doc.missions = {};
                doc.missions[type] = missiontext;
                db.insert(doc, (err, inserteddoc) => { doc = inserteddoc; });
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

    setMissionDescription(db: Nedb, client: Client, message: Discord.Message, text: string): void {
        db.findOne({ "guild-id": message.guild.id }, (err, doc) => {
            if (err) {
                client.bot.logger.error("error finding guild config", err);
                return;
            }
            if (doc == null) {
                //console.log("inserting mission ", type, missiontext);
                doc = { "guild-id": message.guild.id, "last-update": Date.now() };
                doc.missions = {};
                doc.missions["description"] = text;
                db.insert(doc, (err, inserteddoc) => { doc = inserteddoc; });
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

    help(): HelpField {
        return {
            name: "!config", value: `
**[_un_]set-welcome-channel** - Removes the welcome-channel configuration or sets it to the channel where the command was issued.
**mission-clear** - Removes the description and all missions.
**mission-_(primary|secondary|tertiary)_** or
**mission-_(quaternary|quinary|senary)_** or
**mission-_(septenary|octonary|nonary|denary)_** - sets the mission text for the mission
**mission-description** - sets a general description
` };
    }

}
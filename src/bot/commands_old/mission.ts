import * as Discord from "discord.js";
import { RichEmbed } from "discord.js";
import { HelpField, Client } from "../..";

function clearMissions(db: Nedb<any>, guildId: string, client: Client, message: Discord.Message): void {
    db.findOne({ "guild-id": guildId }, (err, doc) => {
        if (err) {
            client.bot.logger.error(`Error loading config for server ${message.guild.name} (${guildId})`);
        }
        if (doc == null) {
            doc = { "guild-id": guildId, "last-update": Date.now() };
            db.insert(doc);
            db.persistence.compactDatafile();
        }
        else {
            doc.missions = undefined;
            doc["last-updated"] = Date.now();
            db.update({ _id: doc._id }, doc);
            db.persistence.compactDatafile();
        }
    });
}

function setMission(db: Nedb<any>, client: Client, message: Discord.Message, args: string[], guildId: string, type: string): void {
    db.findOne({ "guild-id": guildId }, (err, doc) => {
        if (err) {
            client.bot.logger.error(`Error loading config for server ${message.guild.name} (${guildId})`);
        }
        if (doc == null) {
            console.log("inserting mission ", type, args[0]);
            doc = { "guild-id": guildId, "last-update": Date.now() };
            doc.missions = {};
            doc.missions[type] = args[0];
            db.insert(doc, (err, inserteddoc) => { doc = inserteddoc; });
            db.persistence.compactDatafile();
        } else {
            console.log("updating current mission ", type, args[0], doc);
            doc["last-updated"] = Date.now();
            if (!doc.missions) doc.missions = {};
            doc.missions[type] = args[0];

            db.update({ _id: doc._id }, doc);

            db.persistence.compactDatafile();
        }
    });
}

function showMission(db: Nedb<any>, guildId: string, message: Discord.Message): void {
    db.findOne({ "guild-id": guildId }, (err, doc) => {
        if (!doc || !doc.missions) {
            message.channel.send(`:information_source:  ${message.member} there are currently no active missions!`);
            return;
        }
        const embed = new RichEmbed()
            // Set the title of the field
            .setTitle("Currently active missions for the IP3X Corporation")
            .attachFiles(["./images/logo-90-90.png"])
            .setThumbnail("attachment://logo-90-90.png")
            // Set the color of the embed
            .setColor(0x00FF00)
            // Set the main content of the embed
            .setDescription(`Some description`)

            .setTimestamp(new Date());
        if (doc.missions["primary"]) {
            embed.addField(":one: *PRIMARY OBJECTIVE*",
                doc.missions["primary"]);
        }
        if (doc.missions["secondary"]) {
            embed.addField(":two: *SECONDARY OBJECTIVE*",
                doc.missions["secondary"]);
        }
        message.channel.send(embed);
    });


}

exports.run = (client: Client, message: Discord.Message, args: string[]): void => {
    console.debug("in command args", args);

    if (!message.isMentioned(client.users.filter(user => user.id === client.user.id).first())) {
        return;
    }

    args.shift();
    console.debug("in command args 2", args);
    const db = client.bot.config.db;
    if (!db) {
        return;
    }
    args.shift();
    const command = args.shift();
    const guildId = message.guild.id;
    console.debug("in command args 3", args);
    if (command == 'clear') {
        clearMissions(db, guildId, client, message);
    } else if (command == 'set-primary') {
        setMission(db, client, message, args, guildId, "primary");
    } else if (command == 'set-secondary') {
        setMission(db, client, message, args, guildId, "secondary");
    } else if (command == 'objective' || !command) {
        showMission(db, guildId, message);
    } else {
        message.channel.send(`:warning: ${message.member} the command "${command}" is unknown!`);
    }
};


exports.subcommands = (): string[] => {
    return ['clear-missions', 'set-primary', 'set-secondary'];
};

exports.help = (): HelpField => {
    return { name: "help", value: "The list of all commands" };
};



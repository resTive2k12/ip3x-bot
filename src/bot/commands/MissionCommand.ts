import { Command } from "../api/command";
import { Bot } from "../bot";
import { BotConfig } from "../api/bot";
import { Client } from "../api/client";
import * as Discord from "discord.js";

export class MissionCommand implements Command {

    prototype?: object | null | undefined;
    private bot: Bot;

    constructor(bot: Bot) {
        this.bot = bot;
    }

    static matches(config: BotConfig, args: string[]): boolean {
        if (!args || args.length == 0) {
            return false;
        }
        const cmd = args[0];
        return !!cmd && cmd.startsWith(config.prefix + "mission");
    };

    run(client: Client, message: Discord.Message, args?: string[] | undefined): void {
        this.showMission(this.bot.config.db, message.guild.id, message);
    }
    help(): import("../..").HelpField {
        return { name: "!mission", value: "Shows the current mission objectives." };
    }

    showMission(db: Nedb<any>, guildId: string, message: Discord.Message): void {
        db.findOne({ "guild-id": guildId }, (err, doc) => {
            if (!doc || !doc.missions) {
                message.channel.send(`:information_source:  ${message.member} there are currently no active missions!`);
                return;
            }
            const embed = new Discord.RichEmbed()
                // Set the title of the field
                .setTitle("Currently active missions for the IP3X Corporation")
                .attachFiles(["./images/logo-90-90.png"])
                //.setThumbnail("attachment://logo-90-90.png")
                // Set the color of the embed
                .setAuthor("IP3X Command", "attachment://logo-90-90.png")
                .setColor(0x00FF00)
                // Set the main content of the embed
                .setDescription(`Some description`)
                .setTimestamp(Date.now() - 1000 * 60 * 60 * 24 * 3);


            const missionPrios = ["primary", ":one:",
                "secondary", ":two:",
                "tertiary", ":three:",
                "quaternary", ":four:",
                "quinary", ":five:",
                "senary", ":six:",
                "septenary", ":seven:",
                "octonary", ":eight:",
                "nonary", ":nine:",
                "denary", ":keycap_ten:"];

            for (let i = 0; i < missionPrios.length; i += 2) {
                if (doc.missions[missionPrios[i]]) {
                    embed.addField(`${missionPrios[i + 1]} *${missionPrios[i].toUpperCase()} OBJECTIVE*`,
                        doc.missions[missionPrios[i]]);
                }
            }

            if (doc.missions.description) {
                embed.setDescription(doc.missions.description);
            }
            message.channel.send(embed);
        });


    }
}
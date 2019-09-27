import { Client } from "../api/client";
import * as Discord from "discord.js";
import { AbstractCommand } from "./AbstractCommand";

export class MissionCommand extends AbstractCommand {

    public command = "mission";
    public aliases: string[] = [];

    constructor(client: Client) {
        super(client);
    }

    run(message: Discord.Message, args?: string[] | undefined): void {
        if (!message.guild) {
            message.channel.send(`${message.author} Make sure, you are not sending this in a direct message.`);
            return;
        }
        this.showMission(this.client.bot.config.db, message.guild.id, message);
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
                .setTimestamp(Date.now());


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
import { Client } from "../api/client";
import * as Discord from "discord.js";
import { AbstractCommand } from "./AbstractCommand";
import { HelpField } from "../..";

export class MissionCommand extends AbstractCommand {
    public command = "mission";
    public aliases: string[] = [];

    constructor(client: Client) {
        super(client);
    }

    run(message: Discord.Message): void {
        if (!message.guild) {
            message.channel.send(`${message.author} Make sure, you are not sending this in a direct message.`);
            return;
        }
        this.showMission(message);
    }

    showMission(message: Discord.Message): void {
        this.db
            .fetch(message.guild.id)
            .then(doc => {
                if (!doc || !doc.mission || doc.mission.objectives.length === 0) {
                    message.channel.send(`:information_source:  ${message.member} there are currently no objectives!`);
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

    help(): HelpField[] {
        return [{ name: "!mission", value: "Shows the current active objectives.", inline: false }];
    }
}

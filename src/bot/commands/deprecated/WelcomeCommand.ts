import { Client } from "../../api/client";
import * as Discord from "discord.js";
import { AbstractCommand } from "../AbstractCommand";
import { HelpField } from "../../..";

export class WelcomeCommand extends AbstractCommand {
    public command = "welcome";
    public aliases: string[] = [""];
    public botMentionMandatory = false;

    constructor(client: Client) {
        super(client);
    }

    run(message: Discord.Message): void {
        this.db
            .fetch(message.guild.id)
            .then(doc => {
                let targetChannel: Discord.TextChannel | undefined;

                if (doc.welcomeChannelId) {
                    targetChannel = this.client.channels.get(doc.welcomeChannelId) as Discord.TextChannel;
                } else {
                    message.channel.send("Welcome channel currently not configured. Use '@IP3X Assistant !config bind-welcome-channel'.");
                    return;
                }

                if (!targetChannel) {
                    console.warn("no welcome channel set for server. exiting...");
                    return;
                }

                const mention = message.mentions.members.first();

                const embed = new Discord.RichEmbed()
                    .setTitle("Welcome to the ED Squadron *INTERPLANETARY 3XPEDITIONS*")
                    .attachFiles(["./images/logo-90-90.png"])
                    .setThumbnail("attachment://logo-90-90.png")
                    .setColor(0xff0000)
                    .setDescription(`Greetings ${mention ? mention : "Commander"}, welcome to IP3X!\nThis is an automated message. Please take a moment to follow the steps below if you've not done so already.`)
                    .addField(
                        ":one:: JOIN OUR IN-GAME SQUADRON:",
                        `- Tag: IP3X (PC)
      - In-game, the right panel contains Squadrons, search for IP3X and apply.
      `
                    )

                    .addField(":two:: JOIN OUR PRIVATE GROUP:", `- PC: Search for the Group "Evil Tactician", and/or ask an officer on Discord.`)
                    .addField(":three:: JOIN US ON INARA", `- Link: https://inara.cz/squadron/6172/`)
                    .setTimestamp(new Date());
                targetChannel.send(embed);
            })
            .catch(reason => console.log(`error fetching welcome guilddata for id "${message.guild.id}"`, reason));
    }

    help(): HelpField[] {
        return [{ name: "!welcome", value: "Displays a welcome message directed to new members of IP3X with detailed information where to login/register/connect.\n\nIt is _not_ needed to mention this bot for this command to function.", inline: false }];
    }
}

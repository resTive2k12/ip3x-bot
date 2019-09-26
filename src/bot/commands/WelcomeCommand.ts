import { Command } from "../api/command";
import { Bot } from "../bot";
import { BotConfig } from "../api/bot";
import { Client } from "../api/client";
import * as Discord from "discord.js";

export class WelcomeCommand implements Command {

    prototype?: object | null | undefined;
    private bot: Bot;

    constructor(bot: Bot) {
        this.bot = bot;
    }

    static matches(config: BotConfig, args: string[]): boolean {
        const cmd = args[0];
        return !!cmd && cmd.startsWith(config.prefix + "welcome");
    };

    run(client: Client, message: Discord.Message, args?: string[] | undefined): void {
        const db = this.bot.config.db;

        db.findOne({ "guild-id": message.guild.id }, (err: any, doc: any) => {
            if (err) {
                console.error("error loading document", err);
                return;
            }
            if (!doc) {
                console.error("no guild configuration found...");
                return;
            }

            let targetChannel: Discord.TextChannel | undefined;

            if (doc["welcome-channel"]) {
                console.debug(`loading channel ${doc["welcome-channel"]}, ${doc}`);
                targetChannel = client.channels.get(doc["welcome-channel"]) as Discord.TextChannel;
            }

            if (!targetChannel) {
                console.warn('no welcome channel set for server. exiting...');
                return;
            }

            const mention = message.mentions.members.first();

            // We can create embeds using the MessageEmbed constructor
            // Read more about all that you can do with the constructor
            // over at https://discord.js.org/#/docs/main/stable/class/RichEmbed
            const embed = new Discord.RichEmbed()
                // Set the title of the field
                .setTitle("Welcome to the ED Squadron *INTERPLANETARY 3XPEDITIONS*")
                .attachFiles(["./images/logo-90-90.png"])
                .setThumbnail("attachment://logo-90-90.png")
                // Set the color of the embed
                .setColor(0xff0000)
                // Set the main content of the embed
                .setDescription(`Greetings ${mention ? mention : "Commander"}, be welcomed to our discord channel!\nThis is an automated message. Please consider following the steps if not done already.`)
                .addField(
                    "1️⃣: JOIN OUR IN-GAME SQUADRON:",
                    `- Tag: IP3X (PC)
  - In-game, the right panel contains Squadrons, search for IP3X and apply.
  `
                )
                .addField(
                    "2️⃣: JOIN OUR DISCORD:",
                    `    **You are obviously part of that, already!**
  ~~- Link: https://discord.gg/FT5dKKH
  - Please announce your presence in chat and be patient for an officer to respond, depending on the time of day.
  - The Elite channel for IP3X is private, an officer will need to grant you access.~~`
                )
                .addField("3️⃣: JOIN OUR PRIVATE GROUP:", `- PC: Search for the Group "Evil Tactician", and/or ask an officer on Discord.`)
                .addField("4️⃣: JOIN US ON INARA", `- Link: https://inara.cz/squadron/6172/`)
                .setTimestamp(new Date());
            // Send the embed to the same channel as the message
            targetChannel.send(embed);
        });

    }
    help(): import("../..").HelpField {
        return { name: "!welcome [@mention]", value: "Shows the default welcome message to the optionally mentioned user." };
    }
}
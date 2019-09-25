import { Command } from "../api/command";
import { Client } from "../api/client";
import * as Discord from "discord.js";
import { Bot } from "../bot";
import { BotConfig, HelpField } from "../..";

export class HelpCommand implements Command {
    private bot: Bot;

    constructor(bot: Bot) {
        this.bot = bot;
    }

    static matches(config: BotConfig, args: string[]): boolean {
        const cmd = args.shift();
        return !!cmd && cmd.startsWith(config.prefix + "help");
    };

    run(client: Client, message: Discord.Message, args: string[]): void {
        const embed = new Discord.RichEmbed().setTitle("Known commands");
        embed.setAuthor('Automated IP3X assistant', "attachment://charity.png", "https://inara.cz/squadron/6172/");
        embed.attachFiles(["./images/charity.png", "./images/logo-detailed.png"]);
        embed.setThumbnail("attachment://logo-detailed.png");
        client.bot.commands.forEach((v, k) => {
            const commandClass = v[k] as Command;
            if (commandClass && commandClass.matches) {
                const instance = Object.create(commandClass.prototype as object) as Command;
                instance.constructor.apply(instance, ...[client.bot]);
                const help = instance.help();
                if (!help) {
                    embed.addField(k, "No help provided yet.");
                } else {
                    embed.addField(help.name, help.value, help.inline);
                }
            }
        });
        message.channel.send(embed);
    }

    help(): HelpField {
        return { name: "!help", value: "The list of all commands you are watching right now!" };
    }

}
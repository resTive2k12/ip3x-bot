import { Client } from "../../api/client";
import * as Discord from "discord.js";
import { HelpField } from "../../..";
import { AbstractCommand } from "../AbstractCommand";

export class HelpCommand extends AbstractCommand {
  public command = "help";
  public aliases: string[] = [];
  public requiresBotMention = true;

  constructor(client: Client) {
    super(client);
  }

  run(message: Discord.Message, args: string[]): void {
    const embed = new Discord.RichEmbed();

    if (args[2]) {
      const prefix = this.client.bot.config.prefix;
      const result = this.client.bot.commands.find(command => command.command.toLowerCase() === args[2] || !!command.aliases.find(alias => args[2] === prefix + alias));
      if (result) {
        embed.setDescription(`Detailed instructions for the "_${args[2]}_" command.`);
        const helpFields = result.help();
        helpFields.forEach(field => {
          embed.addField(field.name, field.value, field.inline);
        });
      }
    } else {
      embed.setDescription("A list of currently available commands.\nUse `@IP3X Assistant !help <command name>` for more detailed information.\n__You **should** use further help commands in this direct message.__");
      embed.addField("known commands", this.client.bot.commands.map(command => command.command).join(","));
    }

    embed.setAuthor("Automated IP3X assistant", "attachment://charity.png", "https://inara.cz/squadron/6172/");
    embed.attachFiles(["./images/charity.png", "./images/logo-detailed.png"]);
    embed.setThumbnail("attachment://logo-detailed.png");

    message.author.send(embed);
    if (message.channel.type !== "dm") {
      message.channel.send(`${message.author} I have sent you a direct message.`);
    }
  }

  help(): HelpField[] {
    return [{ name: "!help", value: "Just a list of all commands. Use @IP3X Assistant !help <command name> for more detailed information." }];
  }
}
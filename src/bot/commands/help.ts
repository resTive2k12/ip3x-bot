import * as Discord from "discord.js";
import { RichEmbed } from "discord.js";
import { HelpField, Client } from "../..";

exports.run = (client: Client, message: Discord.Message, args: string[]): void => {
  if (message.content.indexOf(client.bot.config.prefix + "help") < 0) {
    console.info(`skipping help command: ${message.content}`);
    return;
  }

  const embed = new RichEmbed().setTitle("Known commands");
  client.bot.commands.forEach((v, k, m) => {
    if (!v.help) {
      embed.addField(k, "No help provided yet.");
    } else {
      const field = v.help() as HelpField;
      embed.addField(field.name, field.value, field.inline);
    }
  });
  message.channel.send(embed);
};

exports.help = (): HelpField => {
  return { name: "help", value: "The list of all commands" };
};

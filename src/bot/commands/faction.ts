import * as Discord from "discord.js";
import { RichEmbed } from "discord.js";
import { HelpField, Client } from "../..";

exports.run = (client: Client, message: Discord.Message, args: string[]): void => {
  if (message.content.indexOf(client.bot.config.prefix + "faction") < 0) {
    console.info(`skipping faction command: ${message.content}`);
    return;
  }

};

exports.help = (): HelpField => {
  return { name: "faction", value: "displays various faction relevant status" };
};

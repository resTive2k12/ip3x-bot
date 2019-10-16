import * as Discord from "discord.js";
import { Client } from "../src/bot/api/client";

function parseMessageIntoParameters(message: Discord.Message): string[] {
  const regex1 = new RegExp(/("[^"\\]*(?:\\[\S\s][^"\\]*)*"|'[^'\\]*(?:\\[\S\s][^'\\]*)*'|\/[^\/\\]*(?:\\[\S\s][^\/\\]*)*\/[gimy]*(?=\s|$)|(?:\\\s|\S)+)/g);
  const args = [];
  let m;
  do {
    m = regex1.exec(message.content.trim());
    if (m) {
      args.push(m[0] as string);
    }
  } while (m);
  return args;
}

module.exports = (client: Client, message: Discord.Message): void => {
  // Ignore all bots
  if (message.author.bot) return;

  //parsing the arguments of the message.
  const args = parseMessageIntoParameters(message);

  if (!args || args.length <= 0) {
    return;
  }

  console.log("Parsed message: ", args);
  let commandExecuted: string | number = "";

  for (let i = 0; i < client.bot.commands.length; i++) {
    const cmd = client.bot.commands[i];
    if (cmd.matches(args)) {
      cmd.run(message, args);
      commandExecuted = cmd.command;
      break;
    }
  }

  if (!commandExecuted) {
    console.debug("No command matched input...");
  } else {
    console.debug("Last command executed:", commandExecuted);
  }
};

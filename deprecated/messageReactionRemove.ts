import * as Discord from "discord.js";
import { Client } from "../src/bot/api/client";

module.exports = (client: Client, reaction: Discord.MessageReaction, user: Discord.User): void => {
  console.log(`${reaction} was removed from ${user}`);
};

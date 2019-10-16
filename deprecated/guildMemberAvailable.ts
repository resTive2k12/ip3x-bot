import * as Discord from "discord.js";
import { Client } from "../src/bot/api/client";

module.exports = (client: Client, member: Discord.GuildMember): void => {
  console.log("member got available: ", member.user.username);
};

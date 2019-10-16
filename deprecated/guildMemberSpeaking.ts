import * as Discord from "discord.js";
import { Client } from "../src/bot/api/client";

module.exports = (client: Client, member: Discord.GuildMember, speaking: boolean): void => {
  console.log(`member ${speaking ? "started" : "stopped"} speaking: `, member.user.username);
};

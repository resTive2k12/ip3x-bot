import * as Discord from "discord.js";
import { Client } from "../src/bot/api/client";

module.exports = (client: Client, oldMember: Discord.GuildMember, newMember: Discord.GuildMember): void => {
  const wasInIP3X = !!oldMember.roles.filter(role => role.name === "IP3X").first();
  const isInIP3X = !!newMember.roles.filter(role => role.name === "IP3X").first();

  console.log(`${newMember.nickname} was in IP3X ${wasInIP3X} and is currently in IP3X ${isInIP3X}`);
};

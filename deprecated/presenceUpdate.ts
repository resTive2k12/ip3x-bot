import * as Discord from "discord.js";
import { Client } from "../src/bot/api/client";
//import diff from 'deep-diff';

module.exports = (client: Client, oldMember: Discord.GuildMember, newMember: Discord.GuildMember): void => {
  console.log("presenceUpdate", `${oldMember.user.username} was ${oldMember.presence.status}.`, `${newMember.user.username} is now ${newMember.presence.status}.`);
};

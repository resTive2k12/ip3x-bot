import * as Discord from "discord.js";
import { Client } from "../api/client";

module.exports = (client: Client, oldMember: Discord.GuildMember, newMember: Discord.GuildMember): void => {
    console.log("presenceUpdate", oldMember.user.username, newMember.user.username);
};

import * as Discord from "discord.js";
import { Client } from "../api/client";

module.exports = (client: Client, member: Discord.GuildMember): void => {
    console.log("member got available: ", member.user.username);
};

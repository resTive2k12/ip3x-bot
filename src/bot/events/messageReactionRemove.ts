import * as Discord from "discord.js";
import { Client } from "../api/client";

module.exports = (client: Client, reaction: Discord.MessageReaction, user: Discord.User): void => {
    console.log(`${reaction} was removed from ${user}`);
};

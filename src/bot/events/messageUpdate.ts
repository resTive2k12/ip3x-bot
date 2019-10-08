import * as Discord from "discord.js";
import { Client } from "../api/client";

module.exports = (client: Client, oldMessage: Discord.Message, newMessage: Discord.Message): void => {
    console.log(`message changed from ${oldMessage.cleanContent} to ${newMessage.cleanContent}`);
};

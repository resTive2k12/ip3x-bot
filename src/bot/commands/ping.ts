import * as Discord from 'discord.js';
import { DiscordClient } from "../..";

exports.run = (client: DiscordClient, message: Discord.Message, args: any): void => {
    message.channel.send("pong!").catch(console.error);
};
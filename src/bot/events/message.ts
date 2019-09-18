import * as Discord from 'discord.js';
import { Bot } from '../bot';
import { Client } from '../..';



module.exports = (client: Client, message: Discord.Message): void => {
    // Ignore all bots
    if (message.author.bot) return;

    // Ignore messages not starting with the prefix (in config.json)
    if (message.content.indexOf(client.bot.config.prefix) !== 0) return;

    // Our standard argument/command name definition.
    const args = message.content.slice(client.bot.config.prefix.length).trim().split(/ +/g) || [];
    if (!args || args.length <= 0) {
        return;
    }

    let command = args.shift();
    if (command) {
        command = command.toLowerCase();
    } else {
        return;
    }

    console.log(command, client.bot.commands);

    // Grab the command data from the client.commands Enmap
    const cmd = client.bot.commands.get(command);

    // If that command doesn't exist, silently exit and do nothing
    if (!cmd) return;

    // Run the command
    cmd.run(client, message, client.bot, args);
};
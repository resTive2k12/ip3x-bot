import * as discord from 'discord.js';
import { DiscordClient } from '../..';



module.exports = (client: DiscordClient, message: discord.Message): void => {
    // Ignore all bots
    if (message.author.bot) return;

    // Ignore messages not starting with the prefix (in config.json)
    if (message.content.indexOf(client.config.prefix) !== 0) return;

    // Our standard argument/command name definition.
    const args = message.content.slice(client.config.prefix.length).trim().split(/ +/g) || [];
    if (!args || args.length <= 0) {
        return;
    }

    let command = args.shift();
    if (command) {
        command = command.toLowerCase();
    } else {
        return;
    }

    console.log(command, client.commands);

    // Grab the command data from the client.commands Enmap
    const cmd = client.commands.get(command);

    // If that command doesn't exist, silently exit and do nothing
    if (!cmd) return;

    // Run the command
    cmd.run(client, message, args);
};
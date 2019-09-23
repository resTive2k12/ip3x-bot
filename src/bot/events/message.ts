import * as Discord from "discord.js";
import { Client } from "../..";

module.exports = (client: Client, message: Discord.Message): void => {
    // Ignore all bots
    if (message.author.bot) return;

    // Ignore messages not starting with bot mention or the prefix (in config.json)
    if (!message.isMentioned(client.users.filter(user => user.id === client.user.id).first()) && message.content.indexOf(client.bot.config.prefix) < 0) {
        return;
    }

    // Our standard argument/command name definition.
    const args = message.content.trim().split(/ +/g) || [];

    console.log("message-event:", args);

    if (!args || args.length <= 0) {
        return;
    }

    let command = "";

    args.forEach(argument => {
        if (argument.startsWith(client.bot.config.prefix)) {
            command = argument.slice(client.bot.config.prefix.length);
        }
    });

    if (command) {
        command = command.toLowerCase();
    } else {
        return;
    }

    // Grab the command data from the client.commands Enmap
    const cmd = client.bot.commands.get(command);

    // If that command doesn't exist, silently exit and do nothing

    if (!cmd) {
        client.bot.logger.error(`Command <${command} ${typeof cmd}> not found...`);
        return;
    } else {
        client.bot.logger.debug(`Command <${command} ${typeof cmd}> found...`);
    }

    // Run the command
    cmd.run(client, message, args);
};

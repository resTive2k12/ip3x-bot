import * as Discord from "discord.js";
import { Client } from "../api/client";
import { Command } from "../api/command";


function parseMessageIntoParameters(message: Discord.Message): string[] {
    const regex1 = new RegExp(/("[^"\\]*(?:\\[\S\s][^"\\]*)*"|'[^'\\]*(?:\\[\S\s][^'\\]*)*'|\/[^\/\\]*(?:\\[\S\s][^\/\\]*)*\/[gimy]*(?=\s|$)|(?:\\\s|\S)+)/g);
    const args = [];
    let m;
    do {
        m = regex1.exec(message.content.trim());
        if (m) {
            args.push(m[0] as string);
        }
    } while (m);
    return args;
}

module.exports = (client: Client, message: Discord.Message): void => {
    // Ignore all bots
    if (message.author.bot) return;

    //parsing the arguments of the message.
    const args = parseMessageIntoParameters(message);

    if (!args || args.length <= 0) {
        return;
    }

    client.bot.commands.forEach((v, k) => {
        const commandClass = v[k] as Command;
        if (commandClass && commandClass.matches && commandClass.matches(client.bot.config, args)) {
            const instance = Object.create(commandClass.prototype as object) as Command;
            instance.constructor.apply(instance, ...[client.bot]);
            instance.run(client, message, args);
        }
    });
};

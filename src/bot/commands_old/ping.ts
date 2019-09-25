import * as Discord from 'discord.js';
import { HelpField } from '../..';


exports.run = (client: Discord.Client, message: Discord.Message, args: object[]): void => {
    if (message.content == "!ping") { // Check if message is "!ping"
        message.channel.send("Pinging ...") // Placeholder for pinging ... 
            .then((msg) => { // Resolve promise
                const tmp = msg as Discord.Message;
                tmp.edit("Ping: " + (Date.now() - tmp.createdTimestamp) / 1000); // Edits message with current timestamp minus timestamp of message
            });
    }
};

exports.help = (): HelpField => {
    return { 'name': 'ping', 'value': 'Pings the server and answers with response time' };
};


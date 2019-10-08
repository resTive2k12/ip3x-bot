import {Client, Message} from 'discord.js';

module.exports = (client: Client, message: Message): void => {
    console.log(`${client.user.username}: Recieved message: ${message}`);
};

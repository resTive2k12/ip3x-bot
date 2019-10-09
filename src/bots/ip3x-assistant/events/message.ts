import {Client, Message} from 'discord.js';

export default (client: Client, message: Message): void => {
    console.log(`${client.user.username}: Recieved message: ${message}`);
};

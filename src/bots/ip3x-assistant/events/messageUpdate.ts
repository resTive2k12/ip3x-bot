import {Client, Message} from 'discord.js';

export default (client: Client, oldMessage: Message, newMessage: Message): void => {
    console.log(`${client.user.username}: message ${oldMessage} changed to ${newMessage}`);
};

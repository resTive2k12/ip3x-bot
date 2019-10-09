import {Client} from 'discord.js';

export default (client: Client): void => {
    console.log(`Logged in as ${client.user.tag}!`);
};

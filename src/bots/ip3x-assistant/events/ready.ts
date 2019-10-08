import {Client} from 'discord.js';

module.exports = (client: Client): void => {
    console.log(`Logged in as ${client.user.tag}!`);
};

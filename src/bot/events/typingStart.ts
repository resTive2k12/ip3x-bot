import * as Discord from 'discord.js';
import {Client} from '../api/client';

module.exports = (client: Client, channel: Discord.Channel, user: Discord.User): void => {
  console.log(`typingStart ${channel}`, user.username);
};

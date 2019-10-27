import { Bot } from '../bot';
import * as Discord from 'discord.js';
import { DB } from '../../utilities/Datastore';

export interface Client extends Discord.Client {
  db: DB;
  bot: Bot;
}

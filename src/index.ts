import * as discord from 'discord.js';
import Enmap from 'enmap';

export interface BotConfig {
    token: string;
    prefix: string;
}

export interface BotCommand {
    process(msg: string, answer: discord.Message): Promise<void>;
}


export interface DiscordClient extends discord.Client {
    config: BotConfig;
    commands: Enmap;
}




import { Bot } from "./bot/bot";
import prodData from './config.json';
const config = prodData;

new Bot(config).start();


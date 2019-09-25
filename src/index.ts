import * as Discord from "discord.js";

import { Bot } from "./bot/bot";
import config from "./config.json";
import winston from "winston";

export interface BotConfig {
  db?: Nedb<any>;
  token: string;
  prefix: string;
}

export interface BotCommand {
  process(msg: string, answer: Discord.Message): Promise<void>;
}



export interface HelpField {
  name: string;
  value: string;
  inline?: boolean;
}

new Bot(config).start();

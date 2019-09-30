import * as Discord from "discord.js";
import { Bot } from "./bot/bot";
import config from "./config.dev.json";
import Datastore from "nedb";
import { BotConfig } from "./bot/api/bot";


export interface BotCommand {
  process(msg: string, answer: Discord.Message): Promise<void>;
}

export interface HelpField {
  name: string;
  value: string;
  inline?: boolean;
}

const botConfig: BotConfig = {
  "db": new Datastore({
    filename: "datastore/config.store",
    autoload: true
  }),
  "token": config.token,
  "prefix": config.prefix
};


new Bot(botConfig).start();
console.log("main thread finished...");
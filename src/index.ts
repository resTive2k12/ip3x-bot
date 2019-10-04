import * as Discord from "discord.js";
import { Bot } from "./bot/bot";
import config from "./config/config.json";
import ggc from "./config/ip3x-jwt.json";
import { DB } from "./utilities/Datastore";
import { BotConfig } from "./bot/api/botconfig";

export interface BotCommand {
    process(msg: string, answer: Discord.Message): Promise<void>;
}

export interface HelpField {
    name: string;
    value: string;
    inline?: boolean;
}

const botConfig: BotConfig = {
    db: new DB("datastore/config.store"),
    token: config.token,
    prefix: config.prefix,
    // eslint-disable-next-line @typescript-eslint/camelcase
    credentials: { client_email: ggc.client_email, private_key: ggc.private_key }
};

new Bot(botConfig).start();
console.log("main thread finished...");

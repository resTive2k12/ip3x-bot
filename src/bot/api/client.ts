import { Bot } from "../bot";
import winston = require("winston");
import * as Discord from "discord.js";

export interface Client extends Discord.Client {
    bot: Bot;
    logger: winston.Logger;
}
import { Bot } from "../bot";
import * as Discord from "discord.js";

export interface Client extends Discord.Client {
    bot: Bot;
}

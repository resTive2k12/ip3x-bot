import { Client } from "./client";
import * as Discord from "discord.js";
import { HelpField } from "../..";
import { BotConfig } from "./bot";

export interface Command {

    run(client: Client, message: Discord.Message, args?: string[]): void;
    help(): HelpField;
    prototype?: object | null;
    matches?(config: BotConfig, args: string[]): boolean;
}
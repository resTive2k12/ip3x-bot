import { Client } from "./client";
import * as Discord from "discord.js";
import { BotConfig, HelpField } from "../..";

export interface Command {

    run(client: Client, message: Discord.Message, args?: string[]): void;
    help(): HelpField;
    prototype?: object | null;
    matches?(config: BotConfig, args: string[]): boolean;
}
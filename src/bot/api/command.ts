import * as Discord from "discord.js";
import { HelpField } from "../..";
import { Client } from "./client";

export interface Command {
    prototype?: object;

    command: string;
    aliases: string[];
    botMentionMandatory: boolean;


    run(message: Discord.Message, args?: string[]): void;
    help(): HelpField[];
    matches(args: string[]): boolean;
}

export interface CommandBuilder {
    new(client: Client): Command;
}


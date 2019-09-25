import { Command } from "../api/command";
import { Bot } from "../bot";
import { BotConfig } from "../..";
import { Client } from "../api/client";
import * as Discord from "discord.js";

export class HelpCommand implements Command {

    prototype?: object | null | undefined;
    private bot: Bot;

    constructor(bot: Bot) {
        this.bot = bot;
    }

    static matches(config: BotConfig, args: string[]): boolean {
        const cmd = args.shift();
        return !!cmd && cmd.startsWith(config.prefix + "help");
    };

    run(client: Client, message: Discord.Message, args?: string[] | undefined): void {
        throw new Error("Method not implemented.");
    }
    help(): import("../..").HelpField {
        return { name: "!help", value: "The list of all commands you are watching right now!" };
    }
}
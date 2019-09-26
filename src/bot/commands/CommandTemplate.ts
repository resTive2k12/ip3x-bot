import { Command } from "../api/command";
import { Bot } from "../bot";
import { BotConfig } from "../api/bot";
import { Client } from "../api/client";
import * as Discord from "discord.js";

export class WelcomeCommand implements Command {

    prototype?: object | null | undefined;
    private bot: Bot;

    constructor(bot: Bot) {
        this.bot = bot;
    }

    static matches(config: BotConfig, args: string[]): boolean {
        throw Error("not implemented yet");
    };

    run(client: Client, message: Discord.Message, args?: string[] | undefined): void {
        throw Error("not implemented yet");
    }
    help(): import("../..").HelpField {
        return { name: "<title>>", value: "<description>" };
    }
}
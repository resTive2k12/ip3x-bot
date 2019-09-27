import { Command } from "../api/command";
import * as Discord from "discord.js";
import { Client } from "../api/client";
import { HelpField } from "../..";

export abstract class AbstractCommand implements Command {
    prototype?: object | undefined;

    public command = "primary command name";
    public aliases: string[] = ["some alias"];
    public botMentionMandatory = false;

    public client: Client;

    constructor(client: Client) {
        this.client = client;
    }

    matches(args: string[]): boolean {
        const prefix = this.client.bot.config.prefix;

        let cmd = args[0];
        const botMention = cmd.match(/^<@!?(\d+)>$/) || [];
        const msgToBot = botMention.length != 0 && botMention[1] == this.client.user.id;

        if (this.botMentionMandatory && !msgToBot) {
            return false;
        }

        if (msgToBot) {
            cmd = args[1];
        }

        return cmd === prefix + this.command || !!this.aliases.find(alias => cmd === prefix + alias);
    };

    run(message: Discord.Message, args?: string[] | undefined): void {
        //nothing to do here
    }

    help(): HelpField[] {
        return [{ name: this.client.bot.config.prefix + this.command, value: "Unspecified help" }];
    }
}
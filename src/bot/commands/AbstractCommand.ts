import { Command, DiscordEvent } from "../api/command";
import * as Discord from "discord.js";
import { Client } from "../api/client";
import { HelpField } from "../..";
import { DB } from "../../utilities/Datastore";

export abstract class AbstractCommand implements Command {
    prototype?: object | undefined;

    public command = "primary command name";
    public aliases: string[] = ["some alias"];
    public botMentionMandatory = false;

    public client: Client;
    protected db: DB;
    
    protected listeners: DiscordEvent[] = [];

    constructor(client: Client) {
        this.client = client;
        this.db = client.bot.config.db;
    }

    public matches(args: string[]): boolean {
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
    }

    initializeListeners(client: Client): void {
        if (!this.listeners || this.listeners.length === 0) {
            return;
        }
        const listeningTo: string[] = [];
        const missing: string[] = [];
        this.listeners.forEach(event => {
            const fn = (this as any)[event.callback];
            if (!fn) {
                missing.push(event.callback);
                return;
            }
            listeningTo.push(event.callback);
            client.on(event.eventName, (this as any)[event.callback].bind(this, client));
        });
        
        console.debug(`${this.constructor.name} has no implementation for ${missing}.`);    
        console.log(`${this.constructor.name} is listening to ${listeningTo}`);

    }




    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    run(message: Discord.Message, args?: string[] | undefined): void {
        //nothing to do here
    }

    help(): HelpField[] {
        return [{ name: this.client.bot.config.prefix + this.command, value: "Unspecified help" }];
    }

    protected parseMessageIntoParameters(message: Discord.Message): string[] {
        const regex1 = new RegExp(/("[^"\\]*(?:\\[\S\s][^"\\]*)*"|'[^'\\]*(?:\\[\S\s][^'\\]*)*'|\/[^\/\\]*(?:\\[\S\s][^\/\\]*)*\/[gimy]*(?=\s|$)|(?:\\\s|\S)+)/g);
        const args = [];
        let m;
        do {
            m = regex1.exec(message.content.trim());
            if (m) {
                args.push(m[0] as string);
            }
        } while (m);
        return args;
    }
}

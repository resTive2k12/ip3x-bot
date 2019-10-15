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

    isAdmin(message: Discord.Message): boolean {
        if (!message.member) {
            console.warn(`Message author ${message.author.username} is not a member of the server (anymore)`);
            return false;
        }

        const allowedRoles = [];
        allowedRoles.push(message.guild.roles.find(role => role.id === '617647181285031947'));
        allowedRoles.push(message.guild.roles.find(role => role.id === '451688525306265600'));

        let hasAdminRole = false;

        allowedRoles.forEach(role => {
            //in roles or user === semtex
            if (role && message.member.roles.get(role.id) || message.member.user.id === '452159417715261445' ) {
                hasAdminRole = true;
            }
        }); 
        
        if (!hasAdminRole) {
            message.channel.send(`${message.member} you are not allowed to perform administrative actions.`);
            return false;
        }
        return true;
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
            client.on(event.eventName, (this as any)[event.callback].bind(this));
        });
        
        if (missing.length > 0) console.debug(`${this.constructor.name} has no implementation for ${missing}.`);    
        console.log(`${this.constructor.name} is listening to ${listeningTo.length > 0 ? listeningTo: 'nothing'}.`);

    }

    protected getUserFromMention(mention: string):Discord.User | undefined {
        // The id is the first and only match found by the RegEx.
        const matches = mention.match(/^<@!?(\d+)>$/);

        // If supplied variable was not a mention, matches will be null instead of an array.
        if (!matches) return undefined;

        // However the first element in the matches array will be the entire mention, not just the ID,
        // so use index 1.
        const id = matches[1];

        return this.client.users.get(id);
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

    run(message: Discord.Message, args?: string[] | undefined): void {
        //throw new Error("Method not implemented.");
    }
}

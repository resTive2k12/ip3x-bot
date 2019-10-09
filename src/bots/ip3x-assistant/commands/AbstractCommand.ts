import * as Discord from 'discord.js';


import {DB} from '../../../utilities/database/Datastore';
import {Command, HelpField} from '../api/command.spec';
import { IP3XAssistant } from '../ip3x-assistant';
import { GuildEntry } from '../../../utilities/database/storage.spec';

export abstract class AbstractCommand implements Command {
    prototype?: object | undefined;

    public command = 'primary command name';
    public aliases: string[] = ['some alias'];
    public botMentionMandatory = false;

    public client: IP3XAssistant;
    protected db: DB<GuildEntry>;

  constructor(client: IP3XAssistant) {
        this.client = client;
        this.db = client.config.db;
    }

    matches(args: string[]): boolean {
        const prefix = this.client.config.prefix;

        let cmd = args[0];
        const botMention = cmd.match(/^<@!?(\d+)>$/) || [];
        const msgToBot = botMention.length != 0 && botMention[1] == this.client.discord.user.id;

        if (this.botMentionMandatory && !msgToBot) {
            return false;
        }

        if (msgToBot) {
            cmd = args[1];
        }

        return cmd === prefix + this.command || !!this.aliases.find(alias => cmd === prefix + alias);
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    run(message: Discord.Message, args?: string[] | undefined): void {
        // nothing to do here
    }

    help(): HelpField[] {
        return [{name: this.client.config.prefix + this.command, value: 'Unspecified help'}];
    }
}

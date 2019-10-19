import { Command, DiscordEvent } from '../api/command';
import * as Discord from 'discord.js';
import { Client } from '../api/client';
import { HelpField } from '../..';
import { DB } from '../../utilities/Datastore';

export abstract class AbstractCommand implements Command {
  prototype?: object | undefined;

  public command = 'primary command name';
  public aliases: string[] = ['some alias'];
  public requiresBotMention = false;
  public requiresPrefix = false;
  public requiresAdminAccess = false;
  public botAllowed = false;
  public requiresGuild = true;
  public applyHelp = true;

  public client: Client;
  protected db: DB;

  protected listeners: DiscordEvent[] = [];

  constructor(client: Client) {
    this.client = client;
    this.db = client.db;
  }

  public async matches(message: Discord.Message): Promise<boolean> {
    if (message.system) {
      return false;
    }
    const args = this.parseMessageIntoParameters(message);

    if (this.requiresGuild && !message.member) {
      console.debug(`${this.constructor.name} needs to be sent from a server. Direct messages are not allowed.`);
      return false;
    }

    if (message.author && message.author.bot && !this.botAllowed) {
      console.debug(`${this.constructor.name} does not work with bot messages.`);
      return false;
    }

    const prefix = this.requiresPrefix ? this.client.bot.config.prefix : '';

    let cmd = args[0];
    if (!cmd) return false;
    const botMention = cmd.match(/^<@!?(\d+)>$/) || [];
    const botIsMentioned = botMention.length != 0 && botMention[1] == this.client.user.id;

    if (this.requiresBotMention && !botIsMentioned) {
      return false;
    }

    if (this.requiresAdminAccess && message.author && !(await this.isAdmin(message.member))) {
      message.author.send(`You are not allowed to use the command '${this.command}'.`);
      return false;
    }

    if (botIsMentioned) {
      cmd = args[1];
    }

    return cmd === prefix + this.command || !!this.aliases.find(alias => cmd === prefix + alias);
  }

  async isAdmin(author?: Discord.GuildMember): Promise<boolean> {
    //admins cannot exist without guild.
    if (!author || !author.guild.available) {
      console.error(`${this.constructor.name}#isAdmin needs a server member to check for rights.`);
      return false;
    }

    let isAdmin = false;
    //if user is superuser then no other check is required
    //console.log('super user check: ', author.user.id !== '452159417715261445');
    if (author.user.id !== '452159417715261445') {
      const entry = await this.db.fetch(author.guild.id);
      if (!entry.adminRoles) {
        return false;
      }
      entry.adminRoles.forEach(adminRole => {
        if (adminRole.type === 'role') {
          if (!!author.roles.find(role => role.id === adminRole.id)) {
            isAdmin = true;
          }
        } else if (adminRole.type === 'user') {
          if (author.user.id == adminRole.id) {
            isAdmin = true;
          }
        }
      });
    } else {
      //user is superuser
      isAdmin = true;
    }

    return isAdmin;
  }

  initializeListeners(): void {
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
      this.client.on(event.eventName, (this as any)[event.callback].bind(this));
    });

    if (missing.length > 0) console.debug(`${this.constructor.name} has no implementation for ${missing}.`);
    console.log(`${this.constructor.name} is listening to ${listeningTo.length > 0 ? listeningTo : 'nothing'}.`);
  }

  protected getUserFromMention(mention: string): Discord.User | undefined {
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
    return [{ name: this.client.bot.config.prefix + this.command, value: 'Unspecified help' }];
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

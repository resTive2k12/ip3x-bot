import { Client } from "../api/client";
import * as Discord from "discord.js";
import { HelpField } from "../..";
import { AbstractCommand } from "./AbstractCommand";
import { DiscordEvents } from "../core/DiscordEvents";
import { AdminRoles } from "../api/storage";

export class RemoveAdmin extends AbstractCommand {
  public command = "remove-admin";
  public aliases: string[] = [];
  public requiresBotMention = true;
  public requiresAdminAccess = true;
  public botAllowed = false;


  constructor(client: Client) {
    super(client);
    this.listeners.push(DiscordEvents.MESSAGE);
  }

  async onMessage(message: Discord.Message): Promise<void> {
    //console.trace(this.constructor.name, 'called.', message.channel.id, message.channel.type, new Date());

    const matches = await this.matches(message);
    if (!matches) {
      return;
    }
    let parsed = this.parseMessageIntoParameters(message);
    parsed = parsed.slice(2);
    const entry = await this.db.fetch(message.guild.id);
    const roles: AdminRoles[] = entry.adminRoles || [];
    parsed.forEach(async item => {
      const mentions = item.match(/^<((@(?:&?|!?))(\d+))>$/);
      if (mentions) {
        if (!roles.find(role => role.id === mentions[3])) {
          console.debug(`${this.constructor.name}#onMessage entry for id ${mentions[3]} does not exists.`);
          return;
        }
        const itemIdx = roles.findIndex(role => role.id === mentions[3]);
        if (itemIdx >= 0) {
          roles.splice(itemIdx, 1);
        }
      }
    });
    entry.adminRoles = roles;
    this.db.update(entry).then(entry => {
      message.channel.send('Successfully removed.');
    }).catch(rejected => {
      message.channel.send('Failed to remove access. Check protocol.');
      console.error("Error saving removed admin access: ", rejected);
    });
  }

  help(): HelpField[] {
    return [{ name: "!help", value: "Just a list of all commands. Use @IP3X Assistant !help <command name> for more detailed information." }];
  }
}

import { Client } from "../api/client";
import * as Discord from "discord.js";
import { HelpField } from "../..";
import { AbstractCommand } from "./AbstractCommand";
import { DiscordEvents } from "../core/DiscordEvents";
import { AdminRoles } from "../api/storage";
import { log } from "../../utilities/Decorators";

export class AddAdmin extends AbstractCommand {
  public command = "add-admin";
  public aliases: string[] = [];
  public requiresBotMention = true;
  public requiresAdminAccess = true;
  public botAllowed = false;


  constructor(client: Client) {
    super(client);
    this.listeners.push(DiscordEvents.MESSAGE);
  }

  async onMessage(message: Discord.Message): Promise<void> {
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
        if (roles.find(role => role.id === mentions[3])) {
          console.debug(`${this.constructor.name}#onMessage entry for id ${mentions[3]} already exists.`);
          return;
        }
        if (mentions[2] === '@&') {
          roles.push({ type: 'role', id: mentions[3] });
        } else if (mentions[2] === '@!' || mentions[2] === '@') {
          roles.push({ type: 'user', id: mentions[3] });
        } else {
          console.debug(`${this.constructor.name}#onMessage ignoring mention ${mentions[0]}. It is not a role or user.`);
        }
      }
    });
    entry.adminRoles = roles;
    this.db.update(entry).then(entry => {
      message.channel.send('Successfully added.');
    }).catch(rejected => {
      message.channel.send('Failed to add access. Check protocol.');
      console.error("Error saving adding admin access: ", rejected);
    });;
  }

  help(): HelpField[] {
    return [{ name: "add-admin", value: "The mentions of users and users are added to the group of users who can change the settings. Mentions of channels will be silently ignored.\n\n**Usage**: ```@IP3X-Assistant add-admin [@role...] [@user...]```" }];
  }
}

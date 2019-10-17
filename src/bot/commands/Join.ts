import { Client } from "../api/client";
import * as Discord from "discord.js";
import { AbstractCommand } from "./AbstractCommand";
import { HelpField } from "../..";
import { DiscordEvents } from "../core/DiscordEvents";


export class Mission extends AbstractCommand {
  public command = "join";
  public aliases: string[] = ['apply'];
  public requiresPrefix = true;


  constructor(client: Client) {
    super(client);
    this.listeners.push(DiscordEvents.MESSAGE);
    this.listeners.push(DiscordEvents.GUILD_MEMBER_ADD);
  }

  async onMessage(message: Discord.Message): Promise<void> {
    if (!(await this.matches(message))) {
      return;
    }
  }

  help(): HelpField[] {
    return [{ name: "!join", value: "Starts the application process for potential new members.", inline: false }];
  }
}

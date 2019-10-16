import * as Discord from "discord.js";
import { Client } from "../api/client";
import { HelpField } from "../..";
import { DB } from "../../utilities/Datastore";
import { AbstractCommand } from "./AbstractCommand";
import { DiscordEvents } from "../core/DiscordEvents";

export class Tests extends AbstractCommand {
  prototype?: object | undefined;

  public command = "primary command name";
  public aliases: string[] = ["some alias"];
  public requiresBotMention = false;


  constructor(client: Client) {
    super(client);
    this.listeners.push(DiscordEvents.MESSAGE);
    this.listeners.push(DiscordEvents.READY);
    this.listeners.push(DiscordEvents.PRESENCE_UPDATE);
  }

  /**
   * Gets called to every message command!
   * @param {Client} client the issueing Client
   * @param {Discord.Message} message the message
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onMessage(client: Client, message: Discord.Message): void {
    //nothing to do here
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  run(message: Discord.Message, args?: string[] | undefined): void {
    //nothing to do here
  }

  help(): HelpField[] {
    return [{ name: this.client.bot.config.prefix + this.command, value: "Unspecified help" }];
  }
}

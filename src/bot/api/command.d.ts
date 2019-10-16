import * as Discord from "discord.js";
import { HelpField } from "../..";
import { Client } from "./client";

export interface Command {
  prototype?: object;

  command: string;
  aliases: string[];
  requiresBotMention: boolean;
  requiresPrefix: boolean;
  requiresAdminAccess: boolean;
  botAllowed: boolean;
  requiresGuild: boolean;

  help(): HelpField[];
  matches(message: Discord.Message): Promise<boolean>;
}

export interface CommandBuilder {
  new(client: Client): Command;
}

export interface DiscordEvent {
  eventName: string;
  callback: string;
}

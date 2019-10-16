import * as Discord from "discord.js";
import { Client } from "../../api/client";
import { HelpField } from "../../..";
import { DB } from "../../../utilities/Datastore";
import { AbstractCommand } from "../AbstractCommand";

export class JoinCommand extends AbstractCommand {
  prototype?: object | undefined;

  public command = "join";
  public aliases: string[] = ["apply"];
  public requiresBotMention = false;
  public requiresPrefix = true;

  constructor(client: Client) {
    super(client);
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  run(message: Discord.Message, args?: string[] | undefined): void {
    const applicant = message.author;
    applicant.send('\n\no7 CMDR ' + applicant.username + '\n\nThe IP3X recruitment process takes a few minutes to complete fully and will see you join IP3X both in-game and on Inara.\n' +
      'This process is mostly automated via this bot - and finalized by verification from one of our Admirals.\n\nCompletion of this process is required within ' +
      '1 week of starting it, or the bot will automatically revoke your access.\n\nPlease confirm you wish to proceed via the \'reactions\' below this message.').then(msg => {
        const m = msg as Discord.Message;
        m.react('✅');
        m.react('❌');
      });
  }

  help(): HelpField[] {
    return [{ name: this.client.bot.config.prefix + this.command, value: "Starts the application process for new members..." }];
  }
}

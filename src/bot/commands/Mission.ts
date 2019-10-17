import { Client } from "../api/client";
import * as Discord from "discord.js";
import { AbstractCommand } from "./AbstractCommand";
import { HelpField } from "../..";
import { DiscordEvents } from "../core/DiscordEvents";

export class Mission extends AbstractCommand {
  public command = "mission";
  public aliases: string[] = ['objectives'];
  public requiresPrefix = true;
  public requiresGuild = true;


  constructor(client: Client) {
    super(client);
    this.listeners.push(DiscordEvents.MESSAGE);
  }

  async onMessage(message: Discord.Message): Promise<void> {
    if (!(await this.matches(message))) {
      return;
    }
    this.showMission(message);
  } 

  showMission(message: Discord.Message): void {
    this.db
      .fetch(message.guild.id)
      .then(doc => {
        if (!doc || !doc.mission || doc.mission.objectives.length === 0) {
          message.channel.send(`:information_source: ${message.member} there are currently no objectives!`);
        } else {
          const embed = new Discord.RichEmbed();
          embed.setTitle(doc.mission.title);
          embed.setDescription(doc.mission.description || "");
          embed.attachFiles(["./images/logo-90-90.png"]);
          embed.setAuthor("IP3X Command", "attachment://logo-90-90.png");
          embed.setColor(0x00ff00);
          embed.setTimestamp(doc.mission.lastSync);

          doc.mission.objectives.forEach(objective => {
            embed.addField(`${objective.title}`, `${objective.description}`);
          });
          message.channel.send(embed);
        }
      })
      .catch(reason => {
        console.log("Error loading data", reason);
        message.channel.send(`${message.author} Error loading mission objectives. Check protocol..`);
      });
  }

  help(): HelpField[] {
    return [{ name: "!mission", value: "Shows the current active objectives.", inline: false }];
  }
}

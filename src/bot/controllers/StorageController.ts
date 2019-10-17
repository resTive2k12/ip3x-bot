import { AbstractController } from "./AbstractController";
import { DiscordEvents } from "../core/DiscordEvents";
import { Client } from "../api/client";
import { GuildEntry } from "../api/storage";

export class StorageController extends AbstractController {

  constructor(client: Client) {
    super(client);
    this.listeners.push(DiscordEvents.READY);
  }

  onReady(): void {
    console.log("ready: ", this.client.guilds.reduce((acc, guild) => acc + `${guild.name} [ID: ${guild.id}] ${guild.owner.user.username} `, ''));
    this.client.guilds.forEach(guild => {
      this.client.bot.config.db.fetch(guild.id).then(() => console.log('found configuration for ' + guild.name)).catch(() => {
        const newGuild: GuildEntry = {
          _id: guild.id, lastUpdate: Date.now()
        };
        this.client.bot.config.db.insert(newGuild);
        console.log(`created new configuration entry for ${guild.name} [ID: ${guild.id}].`);
      });
    });
  }

}

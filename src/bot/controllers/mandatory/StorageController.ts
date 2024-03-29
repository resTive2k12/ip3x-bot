import { AbstractController } from '../AbstractController';
import { Client } from '../../api/client';
import { GuildEntry } from '../../api/storage';

export class StorageController extends AbstractController {
  constructor(client: Client) {
    super(client);
    //this.listeners.push(DiscordEvents.READY);
  }

  async init(): Promise<void> {
    //console.log("ready: ", this.client.guilds.reduce((acc, guild) => acc + `${guild.name} [ID: ${guild.id}] ${guild.owner.user.username} `, ''));

    const guilds = this.client.guilds;
    for (let i = 0; i < guilds.array().length; i++) {
      const guild = guilds.array()[i];
      await this.client.db.fetch(guild.id).catch(() => {
        const newGuild: GuildEntry = {
          _id: guild.id,
          lastUpdate: Date.now()
        };
        this.client.db.insert(newGuild);
        console.log(`created new configuration entry for ${guild.name} [ID: ${guild.id}].`);
      });
    }

    console.info(`${this.constructor.name} finished.`);
  }
}

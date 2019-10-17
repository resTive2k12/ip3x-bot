import { Client } from "../api/client";
import { AbstractController } from "./AbstractController";
import { DiscordEvents } from "../core/DiscordEvents";
import { debug } from "../../utilities/Decorators";

export class MemberController extends AbstractController {

  constructor(client: Client) {
    super(client);
    this.listeners.push(DiscordEvents.READY);
    this.listeners.push(DiscordEvents.GUILD_MEMBER_ADD);
    this.listeners.push(DiscordEvents.GUILD_MEMBER_REMOVE);
  }

  @debug
  onReady(): void {
    const db = this.client.bot.config.db;

    this.client.guilds.forEach(async guild => {
      const entry = await db.fetch(guild.id);
      if (!entry) return;
      const users = entry.users || [];
      guild.members.forEach(member => {
        const userIsKnown = users.some(user => user.id == member.user.id);
        if (!userIsKnown) {
          users.push({ id: member.user.id, name: member.user.username, joinedAt: member.joinedAt });
          console.log(`Added unknown user ${member.nickname || member.user.username} ID: ${member.user.id}`);
        }
      });
      entry.users = users;
      db.update(entry);
    });


  }
}
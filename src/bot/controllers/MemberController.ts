import { Client } from "../api/client";
import { AbstractController } from "./AbstractController";
import { DiscordEvents } from "../core/DiscordEvents";

export class MemberController extends AbstractController {

  constructor(client: Client) {
    super(client);
    this.listeners.push(DiscordEvents.READY);
    this.listeners.push(DiscordEvents.GUILD_MEMBER_ADD);
  }
}
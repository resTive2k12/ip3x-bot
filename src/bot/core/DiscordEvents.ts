import { DiscordEvent } from '../api/command';

export class DiscordEvents {
  static readonly READY: DiscordEvent = { eventName: 'ready', callback: 'onReady' };
  static readonly DISCONNECT: DiscordEvent = { eventName: 'ready', callback: 'onDisconnect' };
  static readonly RECONNECTING: DiscordEvent = { eventName: 'ready', callback: 'onReconnecting' };

  static readonly MESSAGE: DiscordEvent = { eventName: 'message', callback: 'onMessage' };

  static readonly REACTION_ADD: DiscordEvent = { eventName: 'messageReactionAdd', callback: 'onReactionAdd' };
  static readonly REACTION_REMOVE: DiscordEvent = { eventName: 'messageReactionRemove', callback: 'onReactionRemove' };

  static readonly PRESENCE_UPDATE: DiscordEvent = { eventName: 'presenceUpdate', callback: 'onPresenceUpdate' };

  static readonly GUILD_MEMBER_ADD: DiscordEvent = { eventName: 'guildMemberAdd', callback: 'onGuildMemberAdd' };
  static readonly GUILD_MEMBER_REMOVE: DiscordEvent = { eventName: 'guildMemberRemove', callback: 'onGuildMemberRemove' };

  private constructor(private readonly event: string, public readonly callback: string) {
    //empty
  }

  toString(): string {
    return `${this.event} -> ${this.callback}`;
  }
}

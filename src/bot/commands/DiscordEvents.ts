import { DiscordEvent } from "./command";

export class DiscordEvents {
    static readonly MESSAGE: DiscordEvent = {eventName:'message', callback:'onMessage'};
    static readonly READY: DiscordEvent = {eventName:'ready', callback:'onReady'};
    static readonly REACTION_ADD: DiscordEvent = {eventName:'messageReactionAdd', callback:'onReactionAdd'};
    static readonly REACTION_REMOVE: DiscordEvent = {eventName:'messageReactionRemove', callback:'onReactionRemove'};
    static readonly PRESENCE_UPDATE: DiscordEvent = {eventName:'presenceUpdate', callback:'onPresenceUpdate'};

    private constructor(private readonly event: string, public readonly callback: string) {
        //empty
    }

    toString(): string {
        return `${this.event} -> ${this.callback}`;
    }
}

import * as Discord from 'discord.js';

export interface DiscordEvent {
    (client: Discord.Client, ...params: Array<Discord.Message | Discord.GuildMember | Discord.User>[]): void;
}

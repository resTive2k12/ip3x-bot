import {Message} from 'discord.js';

export interface Command {
    matches(args: string[]): boolean;
    run(message: Message, args?: string[] | undefined): void;
    help(): HelpField[];
}

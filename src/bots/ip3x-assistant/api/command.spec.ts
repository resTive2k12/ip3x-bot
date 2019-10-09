import {Message} from 'discord.js';

export interface HelpField {
  name:string;
  value:string;
  inline?:boolean;
}

export interface Command {
    matches(args: string[]): boolean;
    run(message: Message, args?: string[] | undefined): void;
    help(): HelpField[];
}


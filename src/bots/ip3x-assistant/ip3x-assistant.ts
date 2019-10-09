import * as Discord from 'discord.js';
import fs from 'fs';
import {DiscordEvent} from './api/events.spec.js';
import {Config} from './api/config.spec.js';
import * as Winston from 'winston';
import LoggerBuilder from '../../utilities/logging/LoggerBuilder';

export class IP3XAssistant {
    private client: Discord.Client;
    private events: Map<string, DiscordEvent>;
    private commands: Map<string, any>;
    private logger: Winston.Logger;
    private loadConfig = async (): Promise<Config> => await await import('./config/config.json');
    /**
     * d
     */
    constructor() {
        this.client = new Discord.Client();
        this.events = new Map();
        this.commands = new Map();
        this.logger = LoggerBuilder.create('IP3X-Assistant');
        if (process.env.NODE_ENV !== 'production') {
            this.logger.add(
                new Winston.transports.Console({
                    format: Winston.format.combine(Winston.format.colorize(), Winston.format.simple()),
                    level: 'debug'
                })
            );
        }
    }

    /**
     * initialize
     */
    private initialize(): void {
        this.loadEvents();
        this.instantiateCommands();
    }

    /**
     * Loads events from the directory /events
     */
    private loadEvents(): void {
        fs.readdir(__dirname + '/events/', (err, files) => {
            if (err) return console.error(err);
            this.logger.debug('Loading events');
            files.forEach(async file => {
                const {default: event} = await import(`./events/${file}`);
                const eventName = file.split('.')[0];
                this.events.set(eventName, event);
                this.logger.debug(`\t - '${eventName}' from ${file}`);
                this.client.on(eventName, event.bind(null, this.client));
            });
        });
    }

    /**
     * Reads commands from the directory /commands and instantiates them.
     */
    private instantiateCommands(): void {
        fs.readdir(__dirname + '/commands/', (err, files) => {
            if (err) return console.error(err);
            files.forEach(async file => {
                if (!file.endsWith('.js') && !file.endsWith('.ts')) return;
                const commandName = file.split('.')[0];
                if (commandName.startsWith('Abstract')) return;
                this.logger.debug(`Attempting to load command ${commandName}`);
                const command = (await import(`./commands/${file}`)) as any;
                if (command) {
                    const ctor = Object.keys(command)[0];
                    const instance = new command[ctor](this.discordClient);
                    this.commands.push(instance);
                }
            });
        });
    }

    /**
     * sdf
     *
     * @returns {Promise<string>} asfasd
     */
    start(): Promise<string> {
        this.logger.info("Starting discord bot 'IP3X Assistant'");
        this.initialize();
        return this.loadConfig().then(config => this.client.login(config.token));
    }
}

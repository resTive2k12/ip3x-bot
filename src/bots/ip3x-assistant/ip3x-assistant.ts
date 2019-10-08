import * as Discord from 'discord.js';
import fs from 'fs';
import {DiscordEvent} from './api/events.spec.js';
import {Config} from './api/config.spec.js';
import * as Winston from 'winston';

export class IP3XAssistant {
    private client: Discord.Client;
    private events: Map<string, DiscordEvent>;
    private logger: Console | Winston.Logger = console;
    private loadConfig = async (): Promise<Config> => await await import('./config/config.json');
    /**
     * d
     */
    constructor() {
        this.client = new Discord.Client();
        this.events = new Map();
        this.logger = Winston.createLogger({
            level: 'info',
            format: Winston.format.combine(Winston.format.splat(), Winston.format.simple()),
            defaultMeta: {service: 'IP3X-Assinstant'},
            transports: [
                //
                // - Write to all logs with level `info` and below to `combined.log`
                // - Write all logs error (and below) to `error.log`.
                //
                new Winston.transports.File({filename: './logs/error.log', level: 'error'}),
                new Winston.transports.File({filename: './logs/debug.log', level: 'debug'}),
                new Winston.transports.File({filename: './logs/combined.log'})
            ]
        });
        if (process.env.NODE_ENV !== 'production') {
            this.logger.add(
                new Winston.transports.Console({
                    format: Winston.format.simple(),
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
    }

    /**
     * Loads events from the directory /events
     */
    private loadEvents(): void {
        fs.readdir(__dirname + '/events/', (err, files) => {
            if (err) return console.error(err);
            files.forEach(async file => {
                const event = await import(`./events/${file}`);
                const eventName = file.split('.')[0];
                this.events.set(eventName, event);
                this.logger.debug(`Attempting to load event '${eventName}'`);
                this.client.on(eventName, event.default.bind(null, this.client));
            });
        });
    }

    /**
     * sdf
     *
     * @returns {Promise<string>} asfasd
     */
    start(): Promise<string> {
        this.initialize();
        return this.loadConfig().then(config => this.client.login(config.token));
    }
}

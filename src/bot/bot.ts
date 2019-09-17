import * as discord from 'discord.js';
import * as fs from 'fs';
import Enmap from 'enmap';
import { BotConfig } from '..';


export class Bot {
    private botId: string | null = null;
    private config: BotConfig;
    private discordClient: any;

    constructor(config: BotConfig) {
        this.config = config;
        this.discordClient = new discord.Client();
        this.discordClient.config = this.config;
    }


    start(): void {
        this.discordClient.login(this.config.token);
        this.discordClient.on('ready', this.onReady);
        this.loadEvents();
        this.loadCommands();
    }

    onReady(): void {
        console.info('started...');
    }

    onMessage(message: discord.Message): void {
        console.log(message.cleanContent);
    }

    // eslint-disable-next-line @typescript-eslint/explicit-function-return-type
    loadEvents(): void {
        console.info("loading events...");
        fs.readdir(__dirname + "/events/", (err, files) => {
            if (err) return console.error(err);
            files.forEach(async file => {

                const event = await import(`./events/${file}`);
                const eventName = file.split(".")[0];
                console.info(`Attempting to load event '${eventName}'`);
                this.discordClient.on(eventName, event.default.bind(null, this.discordClient));
            });
        });


    }

    loadCommands(): void {
        console.info('loading commands');
        this.discordClient.commands = new Enmap();
        fs.readdir(__dirname + "/commands/", (err, files) => {
            if (err) return console.error(err);
            files.forEach(async file => {
                console.info(file);
                if (!file.endsWith(".js") && !file.endsWith(".ts")) return;
                console.log(file, "found");
                const props = await import(`./commands/${file}`);
                const commandName = file.split(".")[0];
                console.info(`Attempting to load command ${commandName}`);
                this.discordClient.commands.set(commandName, props);
            });
        });
    }
}



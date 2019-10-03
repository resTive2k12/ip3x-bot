import * as discord from "discord.js";
import * as fs from "fs";
import Enmap from "enmap";
import { Client } from "./api/client";
import { BotConfig } from "./api/botconfig";
import { Command } from "./api/command";

export class Bot {
    private botId: string | null = null;
    private discordClient: Client;

    public config: BotConfig;
    public commands: Command[];
    public events: Enmap;

    public logger = console;

    constructor(config: BotConfig) {
        this.config = config;
        this.discordClient = new discord.Client() as Client;
        this.discordClient.bot = this;
        this.commands = [];
        this.events = new Enmap();
    }

    start(): void {
        this.loadEvents();
        this.instantiateCommands();
        this.discordClient.login(this.config.token);
        this.discordClient.on("ready", this.onReady.bind(this));
    }

    onReady(): void {
        this.logger.info(`Bot is ready.\n\t ${this.commands.length} known commands.\n\t listening to ${this.events.size} events (${this.events.keyArray()}).`);
    }

    // eslint-disable-next-line @typescript-eslint/explicit-function-return-type
    loadEvents(): void {
        fs.readdir(__dirname + "/events/", (err, files) => {
            if (err) return console.error(err);
            files.forEach(async file => {
                const event = await import(`./events/${file}`);
                const eventName = file.split(".")[0];
                this.events.set(eventName, event);
                this.logger.debug(`Attempting to load event '${eventName}'`);
                this.discordClient.on(eventName, event.default.bind(null, this.discordClient));
            });
        });
    }

    instantiateCommands(): void {
        fs.readdir(__dirname + "/commands/", (err, files) => {
            if (err) return console.error(err);
            files.forEach(async file => {
                if (!file.endsWith(".js") && !file.endsWith(".ts")) return;
                const commandName = file.split(".")[0];
                if (commandName.startsWith("Abstract")) return;
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
}

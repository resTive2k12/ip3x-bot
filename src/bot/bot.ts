import * as discord from "discord.js";
import * as fs from "fs";
import Enmap from "enmap";
import { BotConfig } from "..";
import * as Winston from "winston";
import Datastore from "nedb";
import { Client } from "./api/client";

export class Bot {
  private botId: string | null = null;
  private discordClient: Client;

  public config: BotConfig;
  public commands: Enmap;
  public events: Enmap;

  public logger: Winston.Logger;

  constructor(config: BotConfig) {
    this.config = config;
    this.discordClient = new discord.Client() as Client;
    this.discordClient.bot = this;
    this.commands = new Enmap();
    this.events = new Enmap();

    this.logger = Winston.createLogger({
      level: "debug",
      format: Winston.format.combine(
        Winston.format.timestamp(),
        Winston.format.printf(({ level, message, timestamp }) => {
          return `${timestamp} ${level}: ${message}`;
        })
      ),
      transports: [new Winston.transports.Console(), new Winston.transports.File({ filename: "combined.log" })]
    });

    this.config.db = new Datastore({
      filename: "datastore/config.store",
      autoload: true
    });
  }

  start(): void {
    this.loadEvents();
    this.loadCommands();
    this.discordClient.login(this.config.token);
    this.discordClient.on("ready", this.onReady.bind(this));
  }

  onReady(): void {
    this.logger.info(`Bot is ready.\n\t ${this.commands.size} known commands\n\t listening to ${this.events.size} events.`);
  }

  // eslint-disable-next-line @typescript-eslint/explicit-function-return-type
  loadEvents(): void {
    this.logger.debug("loading events...");

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

  loadCommands(): void {
    this.logger.debug("loading commands");
    fs.readdir(__dirname + "/commands/", (err, files) => {
      if (err) return console.error(err);
      files.forEach(async file => {
        if (!file.endsWith(".js") && !file.endsWith(".ts")) return;
        const props = await import(`./commands/${file}`) as "Command";
        const commandName = file.split(".")[0];
        this.logger.debug(`Attempting to load command ${commandName}`);
        this.commands.set(commandName, props);
      });
    });
  }
}

import * as discord from 'discord.js';
import * as fs from 'fs';
import { Client } from './api/client';
import { BotConfig } from './api/botconfig';
import { Command } from './api/command';
import { AbstractCommand } from './commands/AbstractCommand';
import { AbstractController } from './controllers/AbstractController';
import { Controller } from './api/controller';
import { StorageController } from './controllers/mandatory/StorageController';
import { DB } from '../utilities/Datastore';
import { UserService } from '../utilities/UserService';

export class Bot {
  private botId: string | null = null;
  private discordClient: Client;

  public config: BotConfig;
  public commands: Command[];
  public controllers: Controller[];

  public logger = console;

  public userService = new UserService('datastore/users.store');

  constructor(config: BotConfig) {
    this.config = config;
    this.discordClient = new discord.Client() as Client;
    this.discordClient.setMaxListeners(20);

    this.discordClient.bot = this;
    this.commands = [];
    this.controllers = [];
    this.discordClient.db = new DB('datastore/config.store');
  }

  start(): void {
    this.discordClient.on('ready', this.onReady.bind(this));
    this.discordClient.login(this.config.token).catch(error => console.error('Error logging in the bot'));
  }

  onReady(): void {
    const storageController = new StorageController(this.discordClient);
    storageController.initializeListeners();
    this.controllers.push(storageController);

    storageController.init().then(() => {
      this.instantiateCommands();
      this.instantiateControllers();
    });
  }

  instantiateCommands(): void {
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
          const instance = new command[ctor](this.discordClient) as AbstractCommand;
          if (instance.initializeListeners) {
            instance.initializeListeners();
          } else {
            console.error(`${commandName} has no listeners configured...`);
          }
          this.commands.push(instance);
        }
      });
    });
  }

  instantiateControllers(): void {
    fs.readdir(__dirname + '/controllers/', (err, files) => {
      if (err) return console.error(err);
      files.forEach(async file => {
        if (!file.endsWith('.js') && !file.endsWith('.ts')) return;
        const controllerName = file.split('.')[0];
        if (controllerName.startsWith('Abstract')) return;
        this.logger.debug(`Attempting to load controller ${controllerName}`);
        const controller = (await import(`./controllers/${file}`)) as any;
        if (controller) {
          const ctor = Object.keys(controller)[0];
          const instance = new controller[ctor](this.discordClient) as AbstractController;
          if (instance.initializeListeners) {
            instance.initializeListeners();
            if (instance.onReady) {
              instance.onReady();
            }
          } else {
            console.error(`${controllerName} has no listeners configured...`);
          }
          this.controllers.push(instance);
        }
      });
    });
  }
}

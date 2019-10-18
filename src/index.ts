import { Bot } from './bot/bot';
import config from './config/config.json';
import { BotConfig } from './bot/api/botconfig';

export interface HelpField {
  name: string;
  value: string;
  inline?: boolean;
}

const botConfig: BotConfig = {
  token: config.token,
  prefix: config.prefix,
  // eslint-disable-next-line @typescript-eslint/camelcase
  credentials: { client_email: config.credentials.client_email, private_key: config.credentials.private_key }
};

new Bot(botConfig).start();
console.log('main thread finished...');

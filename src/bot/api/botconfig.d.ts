import { CredentialBody } from 'google-auth-library';

export interface Sheet {
  id: string;
  tab: string;
  range: string;

  guildId: string;
}

export interface Excelsheets {
  members: Sheet;
}

export interface BotConfig {
  token: string;
  prefix: string;
  credentials: CredentialBody;
  sheets: Excelsheets;
}

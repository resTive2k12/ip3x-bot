import { CredentialBody } from 'google-auth-library';

export interface Excelsheets {
  members: string;
}
export interface BotConfig {
  token: string;
  prefix: string;
  credentials: CredentialBody;
  sheets: Excelsheets;
}

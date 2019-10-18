import { CredentialBody } from "google-auth-library";

export interface BotConfig {
  token: string;
  prefix: string;
  credentials: CredentialBody;
}

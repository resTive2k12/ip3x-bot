import { DB } from "../../utilities/Datastore";
import { CredentialBody } from "google-auth-library";

export interface BotConfig {
    db: DB;
    token: string;
    prefix: string;
    credentials: CredentialBody;
}

import { DB } from "../../utilities/Datastore";

export interface BotConfig {
    db: DB;
    token: string;
    prefix: string;
}

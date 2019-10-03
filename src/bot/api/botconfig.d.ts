export interface BotConfig {
    db: Nedb<any>;
    token: string;
    prefix: string;
}
